/**
 * MockRouterOSClient — a fully stateful virtual MikroTik router.
 *
 * It implements the exact same public surface as the real `RouterOSClient`
 * (see `MikrotikClient` in ./routeros), so every existing API route and page
 * works against it unchanged. Nothing here duplicates application logic: the
 * app talks to the mock through the same `write()`/typed-method abstraction it
 * uses for real RouterOS.
 *
 * Safety rules enforced by this module:
 *  - Mock mode is explicit: a router row must have `isMock = true` AND
 *    `MOCK_ROUTER_ENABLED=true`. A failing *real* connection never falls back
 *    to the mock.
 *  - Real `node-routeros` connections are untouched.
 */
import { prisma } from "./prisma";
import type {
  SystemResource,
  SystemIdentity,
  HotspotUser,
  HotspotUserProfile,
  HotspotActive,
  HotspotHost,
  HotspotCookie,
  HotspotIpBinding,
  HotspotServer,
  PppSecret,
  PppProfile,
  PppActive,
  DhcpLease,
  InterfaceTraffic,
} from "@/types/routeros";
import type { MikrotikClient, RouterOSConfig } from "./routeros";
import { ROUTEROS_DEFAULT_PORT, ROUTEROS_TIMEOUT } from "./constants";
import {
  createSeedState,
  formatUptime,
  MOCK_SEED_VERSION,
  type MockRouterState,
  type MockStatus,
} from "./mock-router-data";

export const MOCK_ROUTER_NAME = "Demo MikroTik Router";
export const MOCK_ROUTER_HOST = "mock.local";
export const MOCK_ROUTER_PORT = 8728;

/** Feature flag. Mock routers can never be created unless this is enabled. */
export function isMockRouterEnabled(): boolean {
  return process.env.MOCK_ROUTER_ENABLED === "true";
}

// ---------------------------------------------------------------------------
// State storage: DB-backed, cached on globalThis so every route bundle shares
// one instance (webpack can otherwise duplicate module instances in dev).
// ---------------------------------------------------------------------------

type MockCache = { state: MockRouterState; loaded: boolean };
const GLOBAL_KEY = "__mikhmon_mock_router_state__";

function globalCache(): MockCache {
  const g = globalThis as unknown as Record<string, MockCache | undefined>;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = { state: createSeedState(), loaded: false };
  return g[GLOBAL_KEY] as MockCache;
}

export async function readMockState(): Promise<MockRouterState> {
  const cache = globalCache();
  // A stale in-memory copy must never outlive the seed it was built from,
  // otherwise an updated dataset would be invisible until a restart.
  if (cache.loaded && cache.state.seedVersion === MOCK_SEED_VERSION) return cache.state;
  try {
    const row = await prisma.mockRouterState.findUnique({ where: { id: "default" } });
    if (row && row.seedVersion === MOCK_SEED_VERSION) {
      cache.state = JSON.parse(row.data) as MockRouterState;
      cache.state.status = (row.status as MockStatus) || "CONNECTED";
    } else {
      cache.state = createSeedState();
      cache.loaded = true;
      await persistMockState(cache.state);
      return cache.state;
    }
  } catch {
    // Database unavailable: fall back to the in-memory seed so the mock still
    // works (development only).
    if (!cache.loaded) cache.state = createSeedState();
  }
  cache.loaded = true;
  return cache.state;
}

async function persistMockState(state: MockRouterState): Promise<void> {
  const cache = globalCache();
  cache.state = state;
  cache.loaded = true;
  try {
    await prisma.mockRouterState.upsert({
      where: { id: "default" },
      create: { id: "default", status: state.status, data: JSON.stringify(state), seedVersion: MOCK_SEED_VERSION },
      update: { status: state.status, data: JSON.stringify(state), seedVersion: MOCK_SEED_VERSION },
    });
  } catch {
    // Keep the in-memory copy; persistence is best-effort for the mock.
  }
}

export async function resetMockState(): Promise<MockRouterState> {
  const fresh = createSeedState();
  await persistMockState(fresh);
  return fresh;
}

export async function setMockStatus(status: MockStatus): Promise<MockRouterState> {
  const state = await readMockState();
  state.status = status;
  await persistMockState(state);
  return state;
}

export async function getMockStatus(): Promise<MockStatus> {
  return (await readMockState()).status;
}

/** Force the next read to reload from the database (used by tests). */
export function invalidateMockCache(): void {
  const g = globalThis as unknown as Record<string, MockCache | undefined>;
  g[GLOBAL_KEY] = undefined;
}

// ---------------------------------------------------------------------------
// RouterOS word (parameter) parsing
// ---------------------------------------------------------------------------

interface Words {
  set: Record<string, string>;
  query: Record<string, string>;
}

function parseWords(params: string[] = []): Words {
  const set: Record<string, string> = {};
  const query: Record<string, string> = {};
  for (const raw of params) {
    if (typeof raw !== "string") continue;
    if (raw.startsWith("=")) {
      const body = raw.slice(1);
      const eq = body.indexOf("=");
      if (eq === -1) set[body] = "";
      else set[body.slice(0, eq)] = body.slice(eq + 1);
    } else if (raw.startsWith("?")) {
      const body = raw.slice(1);
      const eq = body.indexOf("=");
      if (eq === -1) query[body] = "";
      else query[body.slice(0, eq)] = body.slice(eq + 1);
    }
  }
  return { set, query };
}

function matchesQuery(row: Record<string, unknown>, query: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(query)) {
    if (value === "") continue;
    if (String(row[key] ?? "") !== value) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Traffic simulation
// ---------------------------------------------------------------------------

interface TrafficProfile {
  rx: number; // base bits/sec
  tx: number;
}

function trafficProfile(state: MockRouterState, name: string): TrafficProfile {
  switch (name) {
    case "ether1":
      return { rx: 185_000_000, tx: 42_000_000 }; // WAN
    case "ether2":
      return { rx: 96_000_000, tx: 28_000_000 };
    case "ether3":
      return { rx: 71_000_000, tx: 19_000_000 };
    case "ether4":
      return { rx: 24_000_000, tx: 6_000_000 };
    case "wlan1":
      return { rx: 132_000_000, tx: 34_000_000 };
    case "wlan2":
      return { rx: 88_000_000, tx: 21_000_000 };
    case "wlan3":
      return { rx: 54_000_000, tx: 13_000_000 };
    case "bridge":
      return { rx: 210_000_000, tx: 58_000_000 };
    default:
      return { rx: 1_000_000, tx: 500_000 };
  }
}

let lastTrafficTick = 0;

/**
 * Advance counters using real elapsed time, with a smooth sinusoidal jitter.
 * Deterministic (no RNG) so values stay realistic and reproducible.
 */
function advanceTraffic(state: MockRouterState): void {
  const now = Date.now();
  if (!lastTrafficTick) lastTrafficTick = now - 1000;
  const elapsedSec = Math.max(0, (now - lastTrafficTick) / 1000);
  lastTrafficTick = now;
  if (elapsedSec <= 0) return;

  state.interfaces.forEach((iface, idx) => {
    const profile = trafficProfile(state, iface.name);
    const wobble = 0.82 + 0.18 * Math.sin(now / 7000 + idx * 1.7);
    const wobble2 = 0.88 + 0.12 * Math.sin(now / 4300 + idx * 2.3);
    const up = iface.running === "true" && iface.disabled !== "true";
    const rxRate = up ? Math.round(profile.rx * wobble) : 0;
    const txRate = up ? Math.round(profile.tx * wobble2) : 0;
    iface["rx-bits-per-second"] = String(rxRate);
    iface["tx-bits-per-second"] = String(txRate);
    if (!up) return;
    iface["rx-byte"] = String(Number(iface["rx-byte"]) + Math.round((rxRate / 8) * elapsedSec));
    iface["tx-byte"] = String(Number(iface["tx-byte"]) + Math.round((txRate / 8) * elapsedSec));
    iface["rx-packet"] = String(Number(iface["rx-packet"]) + Math.round((rxRate / 8 / 900) * elapsedSec));
    iface["tx-packet"] = String(Number(iface["tx-packet"]) + Math.round((txRate / 8 / 1400) * elapsedSec));
  });
}

// ---------------------------------------------------------------------------
// CPU / memory simulation
// ---------------------------------------------------------------------------

function cpuLoad(state: MockRouterState): string {
  const active = state.hotspotActive.length;
  const base = 6 + Math.min(28, active * 1.6);
  const wobble = 4 * Math.sin(Date.now() / 9000);
  return String(Math.max(1, Math.min(96, Math.round(base + wobble))));
}

function freeMemory(state: MockRouterState): string {
  const total = Number(state["total-memory"]);
  const active = state.hotspotActive.length;
  const used = 20_000_000 + active * 420_000 + state.wireless.length * 90_000;
  const wobble = Math.sin(Date.now() / 11_000) * 1_200_000;
  return String(Math.max(6_000_000, Math.min(total - 4_000_000, total - used - wobble)));
}

// ---------------------------------------------------------------------------
// The client
// ---------------------------------------------------------------------------

export class MockRouterOSClient implements MikrotikClient {
  private config: RouterOSConfig | null = null;
  private connected = false;
  private dirty = false;

  constructor(config?: RouterOSConfig) {
    if (config) this.config = config;
  }

  async connect(config?: RouterOSConfig): Promise<boolean> {
    const cfg = config || this.config;
    if (!cfg) throw new Error("No config provided");
    this.config = { ...cfg, port: cfg.port || ROUTEROS_DEFAULT_PORT, timeout: cfg.timeout || ROUTEROS_TIMEOUT };
    const status = await getMockStatus();
    if (status !== "CONNECTED") {
      this.connected = false;
      return false;
    }
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    await this.flush();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async flush(): Promise<void> {
    if (!this.dirty) return;
    this.dirty = false;
    await persistMockState(await readMockState());
  }

  private touch(): void {
    this.dirty = true;
  }

  private async requireState(): Promise<MockRouterState> {
    const status = await getMockStatus();
    if (status !== "CONNECTED") {
      throw new Error(
        status === "UNREACHABLE"
          ? "mock router is unreachable"
          : "mock router is disconnected",
      );
    }
    const state = await readMockState();
    advanceTraffic(state);
    return state;
  }

  // --- core command dispatch ------------------------------------------------

  async write<T = Record<string, unknown>>(command: string, params: string[] = []): Promise<T[]> {
    const state = await this.requireState();
    const { set, query } = parseWords(params);
    const now = Date.now();
    const nextId = () => `*${++state.idSeq}`;

    const finish = (rows: unknown[]): T[] => rows as T[];

    switch (command) {
      // ---------------- system ----------------
      case "/system/identity/print":
        return finish([{ name: state.identity }]);

      case "/system/resource/print":
        return finish([
          {
            uptime: formatUptime(now - state.bootedAt),
            version: state.version,
            "build-time": state["build-time"],
            "cpu-load": cpuLoad(state),
            "free-memory": freeMemory(state),
            "total-memory": state["total-memory"],
            "free-hdd-space": state["free-hdd-space"],
            "total-hdd-space": state["total-hdd-space"],
            "write-sect-since-reboot": state["write-sect-since-reboot"],
            "architecture-name": state["architecture-name"],
            "board-name": state.boardName,
            platform: state.platform,
            "cpu-count": state["cpu-count"],
            "cpu-frequency": state["cpu-frequency"],
          },
        ]);

      case "/system/clock/print":
        return finish([
          {
            date: new Date(now).toISOString().slice(0, 10).replace(/-/g, "/"),
            time: new Date(now).toISOString().slice(11, 19),
            "time-zone-name": "Asia/Aden",
            "gmt-offset": "+03:00",
          },
        ]);

      case "/system/routerboard/print":
        return finish([{ name: state.boardName, model: state.model, "serial-number": "MOCK2026A1" }]);

      case "/system/reboot":
        state.bootedAt = now;
        state.logs.unshift({ time: new Date(now).toISOString(), topics: "system,info", message: "system rebooted (mock)" });
        this.touch();
        return finish([]);

      case "/system/shutdown":
        state.logs.unshift({ time: new Date(now).toISOString(), topics: "system,info", message: "system shut down (mock)" });
        state.status = "DISCONNECTED";
        this.touch();
        await this.flush();
        return finish([]);

      case "/log/print": {
        const limit = Number(set.limit || query.limit || 50) || 50;
        return finish(state.logs.slice(0, limit));
      }

      case "/system/script/print":
        return finish(state.scripts.filter((s) => matchesQuery(s as unknown as Record<string, unknown>, query)));

      case "/system/script/add": {
        const row = {
          ".id": nextId(),
          name: set.name || "script",
          policy: set.policy || "read,write",
          source: set.source || "",
          disabled: set.disabled === "true" ? "true" : "false",
          comment: set.comment || "",
        };
        state.scripts.push(row);
        this.touch();
        return finish([{ ret: row[".id"] }]);
      }

      case "/system/script/remove": {
        state.scripts = state.scripts.filter((s) => s[".id"] !== set[".id"]);
        this.touch();
        return finish([]);
      }

      case "/system/scheduler/print":
        return finish(state.schedulers.filter((s) => matchesQuery(s as unknown as Record<string, unknown>, query)));

      case "/system/scheduler/remove": {
        state.schedulers = state.schedulers.filter((s) => s[".id"] !== set[".id"]);
        this.touch();
        return finish([]);
      }

      // ---------------- interfaces ----------------
      case "/interface/print":
        return finish(
          state.interfaces.filter((i) => matchesQuery(i as unknown as Record<string, unknown>, query)),
        );

      case "/interface/monitor-traffic": {
        const name = set.interface || query.interface;
        const iface = state.interfaces.find((i) => i.name === name);
        if (!iface) return finish([]);
        return finish([
          {
            name: iface.name,
            "rx-bits-per-second": iface["rx-bits-per-second"],
            "tx-bits-per-second": iface["tx-bits-per-second"],
            "rx-packets-per-second": String(Math.round(Number(iface["rx-bits-per-second"]) / 8 / 900)),
            "tx-packets-per-second": String(Math.round(Number(iface["tx-bits-per-second"]) / 8 / 1400)),
          },
        ]);
      }

      case "/interface/wifi/registration-table/print":
      case "/interface/wireless/registration-table/print":
        return finish(state.wireless.filter((w) => matchesQuery(w as unknown as Record<string, unknown>, query)));

      // ---------------- hotspot ----------------
      case "/ip/hotspot/print":
        return finish(state.hotspotServers.filter((s) => matchesQuery(s as unknown as Record<string, unknown>, query)));

      case "/ip/hotspot/user/print":
        return finish(state.hotspotUsers.filter((u) => matchesQuery(u as unknown as Record<string, unknown>, query)));

      case "/ip/hotspot/user/add": {
        const name = set.name;
        if (!name) throw new Error("failure: name is required");
        if (state.hotspotUsers.some((u) => u.name === name)) {
          throw new Error(`failure: already have user with such name (${name})`);
        }
        const row = {
          ".id": nextId(),
          name,
          password: set.password || "",
          profile: set.profile || "DAILY",
          address: "10.5.50.0/24",
          "mac-address": set["mac-address"] || "00:00:00:00:00:00",
          "limit-uptime": set["limit-uptime"] || "",
          "limit-bytes-total": set["limit-bytes-total"] || "0",
          "limit-bytes-in": set["limit-bytes-in"] || "0",
          "limit-bytes-out": set["limit-bytes-out"] || "0",
          uptime: "0s",
          "bytes-in": "0",
          "bytes-out": "0",
          "packets-in": "0",
          "packets-out": "0",
          comment: set.comment || "",
          disabled: set.disabled === "true" ? "true" : "false",
          server: set.server || "hotspot1",
          "mac-cookie": "00:00:00:00:00:00",
        };
        state.hotspotUsers.push(row);
        state.logs.unshift({ time: new Date(now).toISOString(), topics: "hotspot,info", message: `user ${name} added` });
        this.touch();
        return finish([{ ret: row[".id"] }]);
      }

      case "/ip/hotspot/user/set": {
        const target = state.hotspotUsers.find((u) => u[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        for (const [key, value] of Object.entries(set)) {
          if (key === ".id") continue;
          (target as unknown as Record<string, string>)[key] = value;
        }
        this.touch();
        return finish([]);
      }

      case "/ip/hotspot/user/remove": {
        const id = set[".id"];
        const target = state.hotspotUsers.find((u) => u[".id"] === id);
        state.hotspotUsers = state.hotspotUsers.filter((u) => u[".id"] !== id);
        state.hotspotActive = state.hotspotActive.filter((a) => a.user !== target?.name);
        state.logs.unshift({ time: new Date(now).toISOString(), topics: "hotspot,info", message: `user ${target?.name ?? id} removed` });
        this.touch();
        return finish([]);
      }

      case "/ip/hotspot/user/enable":
      case "/ip/hotspot/user/disable": {
        const target = state.hotspotUsers.find((u) => u[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        target.disabled = command.endsWith("disable") ? "true" : "false";
        this.touch();
        return finish([]);
      }

      case "/ip/hotspot/user/reset-counters": {
        const target = state.hotspotUsers.find((u) => u[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        target.uptime = "0s";
        target["bytes-in"] = "0";
        target["bytes-out"] = "0";
        target["packets-in"] = "0";
        target["packets-out"] = "0";
        this.touch();
        return finish([]);
      }

      case "/ip/hotspot/user/profile/print":
        return finish(state.hotspotProfiles.filter((p) => matchesQuery(p as unknown as Record<string, unknown>, query)));

      case "/ip/hotspot/user/profile/add": {
        const name = set.name;
        if (!name) throw new Error("failure: name is required");
        const row = {
          ".id": nextId(),
          name,
          "shared-users": set["shared-users"] || "1",
          "rate-limit": set["rate-limit"] || "0/0",
          "session-timeout": set["session-timeout"] || "1h",
          "idle-timeout": set["idle-timeout"] || "5m",
          "keepalive-timeout": set["keepalive-timeout"] || "2m",
          "status-autorefresh": "1m",
          "transparent-proxy": "no",
          "http-cookie-lifetime": "1d",
          comment: set.comment || "",
        };
        state.hotspotProfiles.push(row);
        this.touch();
        return finish([{ ret: row[".id"] }]);
      }

      case "/ip/hotspot/user/profile/set": {
        const target = state.hotspotProfiles.find((p) => p[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        for (const [key, value] of Object.entries(set)) {
          if (key === ".id") continue;
          (target as unknown as Record<string, string>)[key] = value;
        }
        this.touch();
        return finish([]);
      }

      case "/ip/hotspot/user/profile/remove": {
        state.hotspotProfiles = state.hotspotProfiles.filter((p) => p[".id"] !== set[".id"]);
        this.touch();
        return finish([]);
      }

      case "/ip/hotspot/active/print":
        return finish(state.hotspotActive.filter((a) => matchesQuery(a as unknown as Record<string, unknown>, query)));

      case "/ip/hotspot/active/remove": {
        state.hotspotActive = state.hotspotActive.filter((a) => a[".id"] !== set[".id"]);
        this.touch();
        return finish([]);
      }

      case "/ip/hotspot/host/print":
        return finish(state.hotspotHosts.filter((h) => matchesQuery(h as unknown as Record<string, unknown>, query)));

      case "/ip/hotspot/host/remove":
        state.hotspotHosts = state.hotspotHosts.filter((h) => h[".id"] !== set[".id"]);
        this.touch();
        return finish([]);

      case "/ip/hotspot/cookie/print":
        return finish(state.hotspotCookies.filter((c) => matchesQuery(c as unknown as Record<string, unknown>, query)));

      case "/ip/hotspot/cookie/remove":
        state.hotspotCookies = state.hotspotCookies.filter((c) => c[".id"] !== set[".id"]);
        this.touch();
        return finish([]);

      case "/ip/hotspot/ip-binding/print":
        return finish(state.hotspotBindings.filter((b) => matchesQuery(b as unknown as Record<string, unknown>, query)));

      case "/ip/hotspot/ip-binding/add": {
        const row = {
          ".id": nextId(),
          "mac-address": set["mac-address"] || "",
          address: set.address || "",
          "to-address": set["to-address"] || "",
          server: set.server || "all",
          type: set.type || "regular",
          disabled: set.disabled === "true" ? "true" : "false",
          comment: set.comment || "",
        };
        state.hotspotBindings.push(row);
        this.touch();
        return finish([{ ret: row[".id"] }]);
      }

      case "/ip/hotspot/ip-binding/set": {
        const target = state.hotspotBindings.find((b) => b[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        for (const [key, value] of Object.entries(set)) {
          if (key === ".id") continue;
          (target as unknown as Record<string, string>)[key] = value;
        }
        this.touch();
        return finish([]);
      }

      case "/ip/hotspot/ip-binding/remove":
        state.hotspotBindings = state.hotspotBindings.filter((b) => b[".id"] !== set[".id"]);
        this.touch();
        return finish([]);

      case "/ip/hotspot/ip-binding/enable":
      case "/ip/hotspot/ip-binding/disable": {
        const target = state.hotspotBindings.find((b) => b[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        target.disabled = command.endsWith("disable") ? "true" : "false";
        this.touch();
        return finish([]);
      }

      // ---------------- ppp ----------------
      case "/ppp/secret/print":
        return finish(state.pppSecrets.filter((s) => matchesQuery(s as unknown as Record<string, unknown>, query)));

      case "/ppp/secret/add": {
        const name = set.name;
        if (!name) throw new Error("failure: name is required");
        const row = {
          ".id": nextId(),
          name,
          password: set.password || "",
          service: set.service || "pppoe",
          profile: set.profile || "pppoe-5m",
          "local-address": set["local-address"] || "",
          "remote-address": set["remote-address"] || "",
          "caller-id": "",
          "last-logged-in": "",
          disabled: set.disabled === "true" ? "true" : "false",
          comment: set.comment || "",
        };
        state.pppSecrets.push(row);
        this.touch();
        return finish([{ ret: row[".id"] }]);
      }

      case "/ppp/secret/set": {
        const target = state.pppSecrets.find((s) => s[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        for (const [key, value] of Object.entries(set)) {
          if (key === ".id") continue;
          (target as unknown as Record<string, string>)[key] = value;
        }
        this.touch();
        return finish([]);
      }

      case "/ppp/secret/remove":
        state.pppSecrets = state.pppSecrets.filter((s) => s[".id"] !== set[".id"]);
        this.touch();
        return finish([]);

      case "/ppp/secret/enable":
      case "/ppp/secret/disable": {
        const target = state.pppSecrets.find((s) => s[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        target.disabled = command.endsWith("disable") ? "true" : "false";
        this.touch();
        return finish([]);
      }

      case "/ppp/profile/print":
        return finish(state.pppProfiles.filter((p) => matchesQuery(p as unknown as Record<string, unknown>, query)));

      case "/ppp/profile/add": {
        const row = {
          ".id": nextId(),
          name: set.name || "profile",
          "local-address": set["local-address"] || "",
          "remote-address": set["remote-address"] || "",
          "rate-limit": set["rate-limit"] || "0/0",
          "only-one": set["only-one"] || "no",
          bridge: set.bridge || "none",
        };
        state.pppProfiles.push(row);
        this.touch();
        return finish([{ ret: row[".id"] }]);
      }

      case "/ppp/profile/remove":
        state.pppProfiles = state.pppProfiles.filter((p) => p[".id"] !== set[".id"]);
        this.touch();
        return finish([]);

      case "/ppp/active/print":
        return finish(state.pppActive.filter((a) => matchesQuery(a as unknown as Record<string, unknown>, query)));

      case "/ppp/active/remove":
        state.pppActive = state.pppActive.filter((a) => a[".id"] !== set[".id"]);
        this.touch();
        return finish([]);

      // ---------------- dhcp ----------------
      case "/ip/dhcp-server/lease/print":
        return finish(state.dhcpLeases.filter((l) => matchesQuery(l as unknown as Record<string, unknown>, query)));

      // ---------------- user manager ----------------
      case "/user-manager/user/print":
        return finish(state.userManagerUsers.filter((u) => matchesQuery(u as unknown as Record<string, unknown>, query)));

      case "/user-manager/user/add": {
        // The application sends `username`; RouterOS 7 expects `name`. Accept
        // both so the UI works against either backend. (Real-device note: the
        // app currently only sends `username` — see feature audit.)
        const name = set.name || set.username;
        if (!name) throw new Error("failure: name is required");
        if (state.userManagerUsers.some((u) => u.name === name)) {
          throw new Error(`failure: already have user with such name (${name})`);
        }
        const profile = state.userManagerProfiles.find((p) => p.name === set.profile);
        const row = {
          ".id": nextId(),
          name,
          username: name,
          password: set.password || "",
          customer: set.customer || "admin",
          profile: set.profile || state.userManagerProfiles[0]?.name || "UM-1H",
          "shared-users": profile?.["shared-users"] || "1",
          "uptime-limit": profile?.["uptime-limit"] || "1h",
          "bytes-limit": profile?.["bytes-limit"] || "0",
          "total-bytes": "0",
          disabled: set.disabled === "true" ? "true" : "false",
          comment: set.comment || "",
        };
        state.userManagerUsers.push(row);
        this.touch();
        return finish([{ ret: row[".id"] }]);
      }

      case "/user-manager/user/set": {
        const target = state.userManagerUsers.find((u) => u[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        for (const [key, value] of Object.entries(set)) {
          if (key === ".id") continue;
          (target as unknown as Record<string, string>)[key] = value;
        }
        this.touch();
        return finish([]);
      }

      case "/user-manager/user/remove":
        state.userManagerUsers = state.userManagerUsers.filter((u) => u[".id"] !== set[".id"]);
        this.touch();
        return finish([]);

      case "/user-manager/user/enable":
      case "/user-manager/user/disable": {
        const target = state.userManagerUsers.find((u) => u[".id"] === set[".id"]);
        if (!target) throw new Error("no such item");
        target.disabled = command.endsWith("disable") ? "true" : "false";
        this.touch();
        return finish([]);
      }

      case "/user-manager/user/create-and-activate-profile": {
        const id = set.numbers || set[".id"];
        const target = state.userManagerUsers.find((u) => u[".id"] === id);
        if (!target) throw new Error("no such item");
        const profile = state.userManagerProfiles.find((p) => p.name === set.profile);
        if (!profile) throw new Error(`no such profile (${set.profile})`);
        target.profile = profile.name;
        target.customer = set.customer || target.customer;
        target["shared-users"] = profile["shared-users"];
        target["uptime-limit"] = profile["uptime-limit"];
        target["bytes-limit"] = profile["bytes-limit"];
        target["total-bytes"] = "0";
        target.disabled = "false";
        state.logs.unshift({
          time: new Date(now).toISOString(),
          topics: "user-manager,info",
          message: `user ${target.name} activated profile ${profile.name}`,
        });
        this.touch();
        return finish([]);
      }

      case "/user-manager/profile/print":
        return finish(state.userManagerProfiles.filter((p) => matchesQuery(p as unknown as Record<string, unknown>, query)));

      default:
        // Unknown command: behave like RouterOS and report a failure so we never
        // silently pretend an unsupported feature works.
        throw new Error(`mock router: unsupported command ${command}`);
    }
  }

  // --- typed helpers (same signatures as RouterOSClient) --------------------

  async getSystemIdentity(): Promise<SystemIdentity> {
    const result = await this.write<SystemIdentity>("/system/identity/print");
    return result[0];
  }

  async getSystemResource(): Promise<SystemResource> {
    const result = await this.write<SystemResource>("/system/resource/print");
    return result[0];
  }

  async reboot(): Promise<void> {
    await this.write("/system/reboot");
  }

  async shutdown(): Promise<void> {
    await this.write("/system/shutdown");
  }

  async getHotspotUsers(filters?: string[]): Promise<HotspotUser[]> {
    return this.write<HotspotUser>("/ip/hotspot/user/print", filters);
  }

  async addHotspotUser(user: Partial<HotspotUser>): Promise<{ ret: string }[]> {
    return this.write("/ip/hotspot/user/add", wordsOf(user));
  }

  async updateHotspotUser(id: string, user: Partial<HotspotUser>): Promise<void> {
    await this.write("/ip/hotspot/user/set", [`=.id=${id}`, ...wordsOf(user)]);
  }

  async removeHotspotUser(id: string): Promise<void> {
    await this.write("/ip/hotspot/user/remove", [`=.id=${id}`]);
  }

  async enableHotspotUser(id: string): Promise<void> {
    await this.write("/ip/hotspot/user/enable", [`=.id=${id}`]);
  }

  async disableHotspotUser(id: string): Promise<void> {
    await this.write("/ip/hotspot/user/disable", [`=.id=${id}`]);
  }

  async resetHotspotUser(id: string): Promise<void> {
    await this.write("/ip/hotspot/user/reset-counters", [`=.id=${id}`]);
  }

  async getHotspotUserProfiles(): Promise<HotspotUserProfile[]> {
    return this.write<HotspotUserProfile>("/ip/hotspot/user/profile/print");
  }

  async addHotspotUserProfile(profile: Partial<HotspotUserProfile>): Promise<{ ret: string }[]> {
    return this.write("/ip/hotspot/user/profile/add", wordsOf(profile));
  }

  async updateHotspotUserProfile(id: string, profile: Partial<HotspotUserProfile>): Promise<void> {
    await this.write("/ip/hotspot/user/profile/set", [`=.id=${id}`, ...wordsOf(profile)]);
  }

  async removeHotspotUserProfile(id: string): Promise<void> {
    await this.write("/ip/hotspot/user/profile/remove", [`=.id=${id}`]);
  }

  async getHotspotActive(server?: string): Promise<HotspotActive[]> {
    const filters = server ? [`?server=${server}`] : undefined;
    return this.write<HotspotActive>("/ip/hotspot/active/print", filters);
  }

  async removeHotspotActive(id: string): Promise<void> {
    await this.write("/ip/hotspot/active/remove", [`=.id=${id}`]);
  }

  async getHotspotHosts(): Promise<HotspotHost[]> {
    return this.write<HotspotHost>("/ip/hotspot/host/print");
  }

  async removeHotspotHost(id: string): Promise<void> {
    await this.write("/ip/hotspot/host/remove", [`=.id=${id}`]);
  }

  async getHotspotCookies(): Promise<HotspotCookie[]> {
    return this.write<HotspotCookie>("/ip/hotspot/cookie/print");
  }

  async removeHotspotCookie(id: string): Promise<void> {
    await this.write("/ip/hotspot/cookie/remove", [`=.id=${id}`]);
  }

  async getHotspotIpBindings(): Promise<HotspotIpBinding[]> {
    return this.write<HotspotIpBinding>("/ip/hotspot/ip-binding/print");
  }

  async addHotspotIpBinding(binding: Partial<HotspotIpBinding>): Promise<{ ret: string }[]> {
    return this.write("/ip/hotspot/ip-binding/add", wordsOf(binding));
  }

  async removeHotspotIpBinding(id: string): Promise<void> {
    await this.write("/ip/hotspot/ip-binding/remove", [`=.id=${id}`]);
  }

  async enableHotspotIpBinding(id: string): Promise<void> {
    await this.write("/ip/hotspot/ip-binding/enable", [`=.id=${id}`]);
  }

  async disableHotspotIpBinding(id: string): Promise<void> {
    await this.write("/ip/hotspot/ip-binding/disable", [`=.id=${id}`]);
  }

  async getHotspotServers(): Promise<HotspotServer[]> {
    return this.write<HotspotServer>("/ip/hotspot/print");
  }

  async getPppSecrets(): Promise<PppSecret[]> {
    return this.write<PppSecret>("/ppp/secret/print");
  }

  async addPppSecret(secret: Partial<PppSecret>): Promise<{ ret: string }[]> {
    return this.write("/ppp/secret/add", wordsOf(secret));
  }

  async updatePppSecret(id: string, secret: Partial<PppSecret>): Promise<void> {
    await this.write("/ppp/secret/set", [`=.id=${id}`, ...wordsOf(secret)]);
  }

  async removePppSecret(id: string): Promise<void> {
    await this.write("/ppp/secret/remove", [`=.id=${id}`]);
  }

  async enablePppSecret(id: string): Promise<void> {
    await this.write("/ppp/secret/enable", [`=.id=${id}`]);
  }

  async disablePppSecret(id: string): Promise<void> {
    await this.write("/ppp/secret/disable", [`=.id=${id}`]);
  }

  async getPppProfiles(): Promise<PppProfile[]> {
    return this.write<PppProfile>("/ppp/profile/print");
  }

  async addPppProfile(profile: Partial<PppProfile>): Promise<{ ret: string }[]> {
    return this.write("/ppp/profile/add", wordsOf(profile));
  }

  async removePppProfile(id: string): Promise<void> {
    await this.write("/ppp/profile/remove", [`=.id=${id}`]);
  }

  async getPppActive(): Promise<PppActive[]> {
    return this.write<PppActive>("/ppp/active/print");
  }

  async removePppActive(id: string): Promise<void> {
    await this.write("/ppp/active/remove", [`=.id=${id}`]);
  }

  async getDhcpLeases(): Promise<DhcpLease[]> {
    return this.write<DhcpLease>("/ip/dhcp-server/lease/print");
  }

  async getInterfaceTraffic(interfaceName: string): Promise<InterfaceTraffic> {
    const result = await this.write<InterfaceTraffic>("/interface/print", [`?name=${interfaceName}`]);
    return result[0];
  }

  async getInterfaces(): Promise<Record<string, string>[]> {
    return this.write<Record<string, string>>("/interface/print");
  }

  async getInterfaceMonitorTraffic(interfaceName: string): Promise<Record<string, string>> {
    const result = await this.write<Record<string, string>>("/interface/monitor-traffic", [
      `=interface=${interfaceName}`,
      "=once=",
    ]);
    return result[0] || {};
  }

  async getWirelessClients(): Promise<Record<string, string>[]> {
    try {
      return await this.write<Record<string, string>>("/interface/wifi/registration-table/print");
    } catch {
      return await this.write<Record<string, string>>("/interface/wireless/registration-table/print");
    }
  }

  async getUserManagerUsers(): Promise<Record<string, string>[]> {
    return this.write<Record<string, string>>("/user-manager/user/print");
  }

  async addUserManagerUser(user: Record<string, string>): Promise<{ ret: string }[]> {
    return this.write("/user-manager/user/add", wordsOf(user));
  }

  async updateUserManagerUser(id: string, user: Record<string, string>): Promise<void> {
    await this.write("/user-manager/user/set", [`=.id=${id}`, ...wordsOf(user)]);
  }

  async removeUserManagerUser(id: string): Promise<void> {
    await this.write("/user-manager/user/remove", [`=.id=${id}`]);
  }

  async enableUserManagerUser(id: string): Promise<void> {
    await this.write("/user-manager/user/enable", [`=.id=${id}`]);
  }

  async disableUserManagerUser(id: string): Promise<void> {
    await this.write("/user-manager/user/disable", [`=.id=${id}`]);
  }

  async getUserManagerProfiles(): Promise<Record<string, string>[]> {
    return this.write<Record<string, string>>("/user-manager/profile/print");
  }

  async renewUserManagerUser(id: string, profile: string, customer = "admin"): Promise<void> {
    await this.write("/user-manager/user/create-and-activate-profile", [
      `=numbers=${id}`,
      `=customer=${customer}`,
      `=profile=${profile}`,
    ]);
  }

  async getLog(limit = 50): Promise<{ time: string; topics: string; message: string }[]> {
    return this.write("/log/print", [`=limit=${limit}`]);
  }
}

function wordsOf(obj: Record<string, unknown>): string[] {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `=${k}=${String(v)}`);
}

export function createMockRouterOSClient(config?: RouterOSConfig): MockRouterOSClient {
  return new MockRouterOSClient(config);
}