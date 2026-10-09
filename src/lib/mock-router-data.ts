/**
 * Deterministic seed dataset for the built-in virtual (mock) MikroTik router.
 *
 * Everything here is generated from a fixed seed so that the dataset is stable
 * across resets and restarts: screenshots, pagination checks and reports are
 * reproducible. Nothing in this file touches a real router.
 */

export const MOCK_SEED_VERSION = 2;

/** Small deterministic PRNG (mulberry32) so the dataset never changes randomly. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type MockStatus = "CONNECTED" | "DISCONNECTED" | "UNREACHABLE";

export interface MockInterface {
  ".id": string;
  name: string;
  type: string;
  "actual-mtu": string;
  "mac-address": string;
  "max-l2mtu": string;
  "last-link-up-time": string;
  "link-downs": string;
  running: string;
  disabled: string;
  "rx-byte": string;
  "tx-byte": string;
  "rx-packet": string;
  "tx-packet": string;
  "rx-bits-per-second": string;
  "tx-bits-per-second": string;
  comment: string;
}

export interface MockWirelessClient {
  ".id": string;
  "mac-address": string;
  interface: string;
  ap: string;
  "uptime": string;
  signal: string;
  "tx-rate": string;
  "rx-rate": string;
  "bytes": string;
  host?: string;
}

export interface MockHotspotUser {
  ".id": string;
  name: string;
  password: string;
  profile: string;
  address: string;
  "mac-address": string;
  "limit-uptime": string;
  "limit-bytes-total": string;
  "limit-bytes-in": string;
  "limit-bytes-out": string;
  uptime: string;
  "bytes-in": string;
  "bytes-out": string;
  "packets-in": string;
  "packets-out": string;
  comment: string;
  disabled: string;
  server: string;
  "mac-cookie": string;
}

export interface MockHotspotProfile {
  ".id": string;
  name: string;
  "shared-users": string;
  "rate-limit": string;
  "session-timeout": string;
  "idle-timeout": string;
  "keepalive-timeout": string;
  "status-autorefresh": string;
  "transparent-proxy": string;
  "http-cookie-lifetime": string;
  comment: string;
}

export interface MockHotspotActive {
  ".id": string;
  user: string;
  address: string;
  "mac-address": string;
  "login-by": string;
  uptime: string;
  "session-time-left": string;
  "idle-time": string;
  "bytes-in": string;
  "bytes-out": string;
  server: string;
}

export interface MockHotspotHost {
  ".id": string;
  "mac-address": string;
  address: string;
  server: string;
  authorized: string;
  bypassed: string;
  comment: string;
}

export interface MockHotspotCookie {
  ".id": string;
  user: string;
  "mac-address": string;
  domain: string;
  expires: string;
}

export interface MockIpBinding {
  ".id": string;
  "mac-address": string;
  address: string;
  "to-address": string;
  server: string;
  type: string;
  disabled: string;
  comment: string;
}

export interface MockHotspotServer {
  ".id": string;
  name: string;
  interface: string;
  address: string;
  "address-pool": string;
  profile: string;
  "port": string;
  disabled: string;
}

export interface MockPppSecret {
  ".id": string;
  name: string;
  password: string;
  service: string;
  profile: string;
  "local-address": string;
  "remote-address": string;
  "caller-id": string;
  "last-logged-in": string;
  disabled: string;
  comment: string;
}

export interface MockPppProfile {
  ".id": string;
  name: string;
  "local-address": string;
  "remote-address": string;
  "rate-limit": string;
  "only-one": string;
  bridge: string;
}

export interface MockPppActive {
  ".id": string;
  name: string;
  service: string;
  "caller-id": string;
  address: string;
  uptime: string;
  encoding: string;
  "session-id": string;
}

export interface MockDhcpLease {
  ".id": string;
  address: string;
  "mac-address": string;
  "host-name": string;
  server: string;
  status: string;
  "last-seen": string;
  "expires-after": string;
  "active-address": string;
  comment: string;
}

export interface MockUserManagerUser {
  ".id": string;
  name: string;
  username: string;
  password: string;
  customer: string;
  profile: string;
  "shared-users": string;
  "uptime-limit": string;
  "bytes-limit": string;
  "total-bytes": string;
  disabled: string;
  comment: string;
}

export interface MockUserManagerProfile {
  ".id": string;
  name: string;
  "shared-users": string;
  "rate-limit": string;
  "uptime-limit": string;
  "bytes-limit": string;
  "price": string;
  comment: string;
}

export interface MockScheduler {
  ".id": string;
  name: string;
  "start-time": string;
  interval: string;
  "on-event": string;
  policy: string;
  disabled: string;
  comment: string;
}

export interface MockScript {
  ".id": string;
  name: string;
  policy: string;
  source: string;
  disabled: string;
  comment: string;
  /** Present on selling-log entries so /api/report/selling can filter by branch. */
  source_id?: string;
  owner?: string;
}

export interface MockLogEntry {
  time: string;
  topics: string;
  message: string;
}

export interface MockRouterState {
  seedVersion: number;
  status: MockStatus;
  bootedAt: number;
  identity: string;
  boardName: string;
  model: string;
  version: string;
  "build-time": string;
  "architecture-name": string;
  platform: string;
  "cpu-count": string;
  "cpu-frequency": string;
  "total-memory": string;
  "free-memory": string;
  "total-hdd-space": string;
  "free-hdd-space": string;
  "write-sect-since-reboot": string;
  interfaces: MockInterface[];
  wireless: MockWirelessClient[];
  hotspotUsers: MockHotspotUser[];
  hotspotProfiles: MockHotspotProfile[];
  hotspotActive: MockHotspotActive[];
  hotspotHosts: MockHotspotHost[];
  hotspotCookies: MockHotspotCookie[];
  hotspotBindings: MockIpBinding[];
  hotspotServers: MockHotspotServer[];
  pppSecrets: MockPppSecret[];
  pppProfiles: MockPppProfile[];
  pppActive: MockPppActive[];
  dhcpLeases: MockDhcpLease[];
  userManagerUsers: MockUserManagerUser[];
  userManagerProfiles: MockUserManagerProfile[];
  schedulers: MockScheduler[];
  scripts: MockScript[];
  logs: MockLogEntry[];
  idSeq: number;
}

const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

/** Deterministic uptime formatting from elapsed milliseconds. */
function uptimeFrom(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const w = Math.floor(total / 604800);
  const d = Math.floor((total % 604800) / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${w}w${d}d${h}h${m}m`;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

export function formatUptime(elapsedMs: number): string {
  return uptimeFrom(elapsedMs);
}

export function createSeedState(now = Date.now()): MockRouterState {
  const rnd = mulberry32(20261010);
  let idSeq = 0;
  const id = () => `*${++idSeq}`;

  const interfaces: MockInterface[] = [
    { name: "ether1", type: "ether", mac: "64:D1:54:00:00:01", comment: "WAN / Upstream" },
    { name: "ether2", type: "ether", mac: "64:D1:54:00:00:02", comment: "DP-A Distribution" },
    { name: "ether3", type: "ether", mac: "64:D1:54:00:00:03", comment: "DP-B Distribution" },
    { name: "ether4", type: "ether", mac: "64:D1:54:00:00:04", comment: "Management" },
    { name: "ether5", type: "ether", mac: "64:D1:54:00:00:05", comment: "Spare (disabled)", disabled: true },
    { name: "wlan1", type: "wlan", mac: "64:D1:54:00:01:01", comment: "AP 5GHz - Building A" },
    { name: "wlan2", type: "wlan", mac: "64:D1:54:00:01:02", comment: "AP 2.4GHz - Building B" },
    { name: "wlan3", type: "wlan", mac: "64:D1:54:00:01:03", comment: "AP 5GHz - Outdoor" },
    { name: "bridge", type: "bridge", mac: "64:D1:54:00:02:01", comment: "Hotspot bridge", running: true },
  ].map((i) => {
    const rxBase = Math.floor(rnd() * 400 * GB + 8 * GB);
    const txBase = Math.floor(rnd() * 120 * GB + 3 * GB);
    const running = i.disabled ? "false" : "true";
    return {
      ".id": id(),
      name: i.name,
      type: i.type,
      "actual-mtu": i.type === "wlan" ? "1500" : "1500",
      "mac-address": i.mac,
      "max-l2mtu": "2028",
      "last-link-up-time": `jan/02/2026 08:${pad(10 + Math.floor(rnd() * 45))}:11`,
      "link-downs": i.disabled ? "4" : "0",
      running,
      disabled: i.disabled ? "true" : "false",
      "rx-byte": String(rxBase),
      "tx-byte": String(txBase),
      "rx-packet": String(Math.floor(rxBase / 900)),
      "tx-packet": String(Math.floor(txBase / 1100)),
      "rx-bits-per-second": "0",
      "tx-bits-per-second": "0",
      comment: i.comment,
    } as MockInterface;
  });

  const hosts = [
    "office-pc-01", "office-pc-02", "reception", "printer-hq", "camera-gate",
    "pos-terminal-1", "pos-terminal-2", "router-test", "phone-front-desk",
    "laptop-alex", "laptop-sara", "tv-lounge", "nas-backup", "switch-core",
    "ap-controller", "cashier-01", "cashier-02", "guest-iphone", "guest-pixel",
    "guest-galaxy", "lab-pc-01", "lab-pc-02", "workshop-pc", "cctv-nvr",
  ];

  const wireless: MockWirelessClient[] = [];
  const wifiIfaces = ["wlan1", "wlan2", "wlan3"];
  const wifiAps = ["wlan1-ap", "wlan2-ap", "wlan3-ap"];
  for (let i = 0; i < 27; i++) {
    const slot = i % 3;
    const iface = wifiIfaces[slot];
    wireless.push({
      ".id": id(),
      "mac-address": `A4:2B:B0:${pad(10 + Math.floor(i / 256))}:${pad((i * 7) % 256)}:${pad((i * 13) % 256)}`,
      interface: iface,
      ap: wifiAps[slot],
      uptime: uptimeFrom((40 + Math.floor(rnd() * 5000)) * 60 * 1000),
      signal: `-38-${Math.floor(rnd() * 55)} dBm`,
      "tx-rate": String(Math.floor(24 + rnd() * 96)),
      "rx-rate": String(Math.floor(30 + rnd() * 120)),
      bytes: String(Math.floor(rnd() * 40 * GB + 200 * MB)),
      host: hosts[i % hosts.length],
    });
  }

  const hotspotProfiles: MockHotspotProfile[] = [
    { name: "1HOUR", "shared-users": "10", "rate-limit": "4M/8M", "session-timeout": "1h", "idle-timeout": "5m", "keepalive-timeout": "2m", "http-cookie-lifetime": "1h" },
    { name: "3HOUR", "shared-users": "10", "rate-limit": "6M/12M", "session-timeout": "3h", "idle-timeout": "5m", "keepalive-timeout": "2m", "http-cookie-lifetime": "3h" },
    { name: "DAILY", "shared-users": "5", "rate-limit": "8M/16M", "session-timeout": "1d", "idle-timeout": "10m", "keepalive-timeout": "2m", "http-cookie-lifetime": "1d" },
    { name: "WEEKLY", "shared-users": "3", "rate-limit": "10M/20M", "session-timeout": "7d", "idle-timeout": "15m", "keepalive-timeout": "2m", "http-cookie-lifetime": "7d" },
    { name: "MONTHLY", "shared-users": "2", "rate-limit": "12M/24M", "session-timeout": "30d", "idle-timeout": "20m", "keepalive-timeout": "2m", "http-cookie-lifetime": "30d" },
    { name: "UNLIMITED", "shared-users": "20", "rate-limit": "0/0", "session-timeout": "0", "idle-timeout": "0", "keepalive-timeout": "0", "http-cookie-lifetime": "1d" },
  ].map((p) => ({ ".id": id(), comment: "", "status-autorefresh": "1m", "transparent-proxy": "no", ...p } as MockHotspotProfile));

  const profileNames = hotspotProfiles.map((p) => p.name);
  const limits: Record<string, { up: string; bytes: string }> = {
    "1HOUR": { up: "1h", bytes: "1073741824" },
    "3HOUR": { up: "3h", bytes: "3221225472" },
    DAILY: { up: "1d", bytes: String(8 * GB) },
    WEEKLY: { up: "7d", bytes: String(40 * GB) },
    MONTHLY: { up: "30d", bytes: String(100 * GB) },
    UNLIMITED: { up: "0", bytes: "0" },
  };

  // 120 hotspot cards: a healthy mix of unused / used / disabled / expired.
  const hotspotUsers: MockHotspotUser[] = [];
  for (let i = 0; i < 120; i++) {
    const profile = profileNames[i % profileNames.length];
    const lim = limits[profile];
    const state = i % 10 === 7 ? "disabled" : i % 12 === 11 ? "expired" : i % 3 === 0 ? "used" : "unused";
    const usedUptime = state === "used" ? uptimeFrom((10 + Math.floor(rnd() * 4000)) * 60 * 1000) : state === "expired" ? uptimeFrom((60 + Math.floor(rnd() * 900)) * 60 * 1000) : "0s";
    const bytesIn = state === "unused" ? 0 : Math.floor(rnd() * Number(lim.bytes || 800 * MB || 1));
    hotspotUsers.push({
      ".id": id(),
      name: `test${pad(i + 1, 3)}`,
      password: String(Math.floor(100000 + rnd() * 899999)),
      profile,
      address: "10.5.50.0/24",
      "mac-address": "00:00:00:00:00:00",
      "limit-uptime": lim.up,
      "limit-bytes-total": lim.bytes,
      "limit-bytes-in": String(Math.floor(Number(lim.bytes) * 0.6) || 0),
      "limit-bytes-out": String(Math.floor(Number(lim.bytes) * 0.4) || 0),
      uptime: usedUptime,
      "bytes-in": String(bytesIn),
      "bytes-out": String(Math.floor(bytesIn * (0.2 + rnd() * 0.4))),
      "packets-in": String(Math.floor(bytesIn / 900)),
      "packets-out": String(Math.floor(bytesIn / 1400)),
      comment: i % 4 === 0 ? "reseller:front-desk" : i % 7 === 0 ? "voucher" : "",
      disabled: state === "disabled" ? "true" : "false",
      server: "hotspot1",
      "mac-cookie": "00:00:00:00:00:00",
    });
  }

  const activeUsers = hotspotUsers.filter((u) => u.disabled !== "true").slice(0, 18);
  const hotspotActive: MockHotspotActive[] = activeUsers.map((u, i) => ({
    ".id": id(),
    user: u.name,
    address: `10.5.50.${20 + i}`,
    "mac-address": u["mac-address"] === "00:00:00:00:00:00" ? `DC:2C:6A:${pad(1 + (i % 40))}:${pad(i * 3)}:${pad(i * 5)}` : u["mac-address"],
    "login-by": i % 3 === 0 ? "mac-cookie" : i % 3 === 1 ? "http-chap" : "https",
    uptime: uptimeFrom((2 + Math.floor(rnd() * 900)) * 60 * 1000),
    "session-time-left": `1h${pad(Math.floor(rnd() * 59))}m`,
    "idle-time": `${pad(Math.floor(rnd() * 20))}m`,
    "bytes-in": String(Math.floor(rnd() * 800 * MB + 8 * MB)),
    "bytes-out": String(Math.floor(rnd() * 300 * MB + 3 * MB)),
    server: "hotspot1",
  }));

  const hotspotHosts: MockHotspotHost[] = Array.from({ length: 26 }, (_, i) => ({
    ".id": id(),
    "mac-address": `E8:94:F6:${pad(1 + i)}:${pad((i * 5) % 256)}:${pad((i * 11) % 256)}`,
    address: `10.5.50.${30 + i}`,
    server: "hotspot1",
    authorized: i % 6 === 0 ? "yes" : "no",
    bypassed: i % 9 === 0 ? "yes" : "no",
    comment: i % 6 === 0 ? "authorized device" : "",
  }));

  const hotspotCookies: MockHotspotCookie[] = hotspotActive.slice(0, 12).map((a) => ({
    ".id": id(),
    user: a.user,
    "mac-address": a["mac-address"],
    domain: "login.mikrotik.local",
    expires: "jan/01/2030 00:00:00",
  }));

  const hotspotBindings: MockIpBinding[] = [
    { ".id": id(), "mac-address": "DC:2C:6A:00:00:07", address: "10.5.50.7", type: "blocked", comment: "blocked by admin", disabled: "false" },
    { ".id": id(), "mac-address": "DC:2C:6A:00:00:08", address: "10.5.50.8", type: "blocked", comment: "blocked by admin", disabled: "false" },
    { ".id": id(), address: "10.5.50.99", type: "blocked", comment: "blocked by address", disabled: "false" },
    { ".id": id(), "mac-address": "E8:94:F6:01:00:01", type: "bypassed", comment: "printer bypass", disabled: "false" },
    { ".id": id(), "mac-address": "E8:94:F6:01:00:02", type: "regular", comment: "", disabled: "false" },
  ].map((b) => ({ "to-address": "", server: "all", ...b } as MockIpBinding));

  const hotspotServers: MockHotspotServer[] = [
    { ".id": id(), name: "hotspot1", interface: "bridge", address: "10.5.50.1/24", "address-pool": "static-only", profile: "DAILY", port: "80,443", disabled: "false" },
    { ".id": id(), name: "hotspot2", interface: "ether4", address: "192.168.88.1/24", "address-pool": "static-only", profile: "UNLIMITED", port: "80", disabled: "true" },
  ];

  const pppProfiles: MockPppProfile[] = [
    { ".id": id(), name: "pppoe-5m", "local-address": "10.10.10.1", "remote-address": "10.10.10.2", "rate-limit": "5M/10M", "only-one": "yes", bridge: "bridge" },
    { ".id": id(), name: "pppoe-10m", "local-address": "10.10.10.1", "remote-address": "10.10.10.2", "rate-limit": "10M/20M", "only-one": "yes", bridge: "bridge" },
    { ".id": id(), name: "pppoe-unlimited", "local-address": "10.10.10.1", "remote-address": "10.10.10.2", "rate-limit": "0/0", "only-one": "no", bridge: "bridge" },
  ];

  const pppSecrets: MockPppSecret[] = Array.from({ length: 14 }, (_, i) => ({
    ".id": id(),
    name: `ppp-user-${pad(i + 1)}`,
    password: String(1000 + i * 7),
    service: "pppoe",
    profile: pppProfiles[i % pppProfiles.length].name,
    "local-address": "10.10.10.1",
    "remote-address": "10.10.10." + (10 + i),
    "caller-id": "",
    "last-logged-in": i % 3 === 0 ? "jan/09/2026 14:22:07" : "",
    disabled: i % 8 === 7 ? "true" : "false",
    comment: i % 4 === 0 ? "reseller:a" : "",
  }));

  const pppActive: MockPppActive[] = pppSecrets.filter((s) => s.disabled !== "true").slice(0, 6).map((s, i) => ({
    ".id": id(),
    name: s.name,
    service: "pppoe",
    "caller-id": `00:1A:2B:${pad(3 + i)}:${pad(20 + i)}:${pad(40 + i)}`,
    address: s["remote-address"],
    uptime: uptimeFrom((30 + Math.floor(rnd() * 8000)) * 60 * 1000),
    encoding: "MPPE",
    "session-id": `0x${(0x1000 + i * 13).toString(16)}`,
  }));

  const dhcpLeases: MockDhcpLease[] = Array.from({ length: 24 }, (_, i) => ({
    ".id": id(),
    address: `192.168.88.${50 + i}`,
    "mac-address": `E8:94:F6:${pad(2 + i)}:${pad((i * 7) % 256)}:${pad((i * 3) % 256)}`,
    "host-name": hosts[i % hosts.length],
    server: "dhcp1",
    status: i % 11 === 10 ? "wait-remove" : "bound",
    "last-seen": `jan/10/2026 10:${pad(10 + i)}:0${i % 10}`,
    "expires-after": `1d${pad((i * 7) % 60)}m`,
    "active-address": `192.168.88.${50 + i}`,
    comment: "",
  }));

  const userManagerProfiles: MockUserManagerProfile[] = [
    { ".id": id(), name: "UM-1H", "shared-users": "1", "rate-limit": "5M/10M", "uptime-limit": "1h", "bytes-limit": String(GB), price: "2000", comment: "hourly package" },
    { ".id": id(), name: "UM-1D", "shared-users": "1", "rate-limit": "8M/16M", "uptime-limit": "1d", "bytes-limit": String(10 * GB), price: "10000", comment: "daily package" },
    { ".id": id(), name: "UM-7D", "shared-users": "1", "rate-limit": "10M/20M", "uptime-limit": "7d", "bytes-limit": String(50 * GB), price: "50000", comment: "weekly package" },
    { ".id": id(), name: "UM-30D", "shared-users": "2", "rate-limit": "12M/24M", "uptime-limit": "30d", "bytes-limit": String(150 * GB), price: "150000", comment: "monthly package" },
  ];

  const userManagerUsers: MockUserManagerUser[] = Array.from({ length: 30 }, (_, i) => {
    const p = userManagerProfiles[i % userManagerProfiles.length];
    return {
      ".id": id(),
      name: `um-user-${pad(i + 1, 3)}`,
      username: `um-user-${pad(i + 1, 3)}`,
      password: String(100000 + Math.floor(rnd() * 899999)),
      customer: i % 3 === 0 ? "admin" : i % 3 === 1 ? "reseller-jeddah" : "reseller-sanaa",
      profile: p.name,
      "shared-users": p["shared-users"],
      "uptime-limit": p["uptime-limit"],
      "bytes-limit": p["bytes-limit"],
      "total-bytes": i % 4 === 0 ? p["bytes-limit"] : String(Math.floor(rnd() * Number(p["bytes-limit"]))),
      disabled: i % 9 === 8 ? "true" : "false",
      comment: i % 5 === 0 ? "VIP" : "",
    } as MockUserManagerUser;
  });

  const schedulers: MockScheduler[] = [
    { ".id": id(), name: "backup-daily", "start-time": "02:30:00", interval: "1d", "on-event": "/system script run backup", policy: "ftp,reboot", disabled: "false", comment: "nightly backup" },
    { ".id": id(), name: "reboot-weekly", "start-time": "04:00:00", interval: "7d", "on-event": "/system reboot", policy: "reboot", disabled: "false", comment: "" },
    { ".id": id(), name: "log-cleanup", "start-time": "23:45:00", interval: "1d", "on-event": "/system script run log-cleanup", policy: "none", disabled: "true", comment: "" },
  ];

  const scripts: MockScript[] = [
    { ".id": id(), name: "backup", policy: "read,write,policy,ftp", source: ":log info \"mock backup\"", disabled: "false", comment: "" },
    { ".id": id(), name: "log-cleanup", policy: "read,write,policy", source: ":log info \"mock log cleanup\"", disabled: "false", comment: "" },
  ];

  // Selling-log entries: the application stores each card sale as a RouterOS
  // script entry named "Date-|-Time-|-Username-|-Price-|-|...-|-|Profile-|-Comment"
  // with comment "mikhmon", which is what /api/report/selling reads.
  const sellers = ["front-desk", "branch-2", "wholesale", "online"];
  for (let d = 20; d >= 0; d--) {
    const rows = 1 + ((d * 3) % 4);
    for (let i = 0; i < rows; i++) {
      const day = new Date(now - d * 86400000);
      const date = `${pad(day.getDate())}/${pad(day.getMonth() + 1)}/${day.getFullYear()}`;
      const time = `${pad(8 + i * 2)}:${pad((d * 7 + i * 13) % 60)}:${pad((d * 3 + i) % 60)}`;
      const user = `sale${pad(d * 5 + i + 1, 4)}`;
      const price = ["2000", "10000", "12000", "50000"][(d + i) % 4];
      const profile = ["1HOUR", "DAILY", "UM-1D", "WEEKLY"][(d + i) % 4];
      const owner = sellers[(d + i) % sellers.length];
      scripts.push({
        ".id": id(),
        name: `${date}-|-${time}-|-${user}-|-${price}-|-1h-|-5G-|-voucher-|-${profile}-|-${owner}`,
        policy: "read,write,policy",
        source: `:put [/ip hotspot user find name=$user] comment="mikhmon"`,
        disabled: "false",
        comment: "mikhmon",
        source_id: owner,
        owner,
      } as MockScript);
    }
  }

  const logs: MockLogEntry[] = Array.from({ length: 20 }, (_, i) => ({
    time: `jan/10/2026 11:${pad(10 + i)}:0${i % 10}`,
    topics: ["hotspot", "system", "dhcp", "ppp", "wireless"][i % 5] + ",info",
    message: [
      "user test001 logged in",
      "user test002 disconnected",
      "dhcp lease assigned to office-pc-01",
      "ppp-user-03 session started",
      "interface ether2 link up",
      "user test015 rate limit reached",
    ][i % 6],
  }));

  return {
    seedVersion: MOCK_SEED_VERSION,
    status: "CONNECTED",
    bootedAt: now - 1000 * 60 * 60 * 24 * 9 - 1000 * 60 * 137,
    identity: "MT-DEMO-DEMO01",
    boardName: "hAP ac²",
    model: "RB952Ui-5ac2n",
    version: "7.14.3 (stable)",
    "build-time": "2025/11/12 10:24:31",
    "architecture-name": "arm",
    platform: "mikrotik",
    "cpu-count": "1",
    "cpu-frequency": "650MHz",
    "total-memory": String(64 * MB),
    "free-memory": String(41 * MB),
    "total-hdd-space": String(16 * MB),
    "free-hdd-space": String(9 * MB),
    "write-sect-since-reboot": "184213",
    interfaces,
    wireless,
    hotspotUsers,
    hotspotProfiles,
    hotspotActive,
    hotspotHosts,
    hotspotCookies,
    hotspotBindings,
    hotspotServers,
    pppSecrets,
    pppProfiles,
    pppActive,
    dhcpLeases,
    userManagerUsers,
    userManagerProfiles,
    schedulers,
    scripts,
    logs,
    idSeq,
  };
}