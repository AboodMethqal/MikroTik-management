/**
 * Client-per-interface attribution.
 *
 * A distribution point is a physical interface (usually a wired `etherN` or an
 * AP `wlanN`). RouterOS does not tag hotspot/DHCP/ARP records with the egress
 * interface for wireless clients, so wired clients are attributed by matching
 * their address against the subnet configured on that interface
 * (`/ip/address/print`).
 */

/** Parse "10.5.50.1/24" or "10.5.50.0/24" into a numeric network + mask. */
export function parseCidr(
  cidr: string,
): { base: number; mask: number } | null {
  const [addr, prefixRaw] = String(cidr).split("/");
  const octets = addr?.split(".");
  if (!octets || octets.length !== 4) return null;
  const prefix = Number(prefixRaw);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
  const ip = octets.reduce((acc, o) => (acc << 8) + (Number(o) & 0xff), 0) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return { base: (ip & mask) >>> 0, mask };
}

export function ipToNumber(ip: string): number | null {
  const octets = String(ip).split(".");
  if (octets.length !== 4) return null;
  for (const o of octets) {
    if (!/^\d{1,3}$/.test(o)) return null;
  }
  return octets.reduce((acc, o) => (acc << 8) + (Number(o) & 0xff), 0) >>> 0;
}

export function isInSubnet(ip: string, cidr: string): boolean {
  const net = parseCidr(cidr);
  const value = ipToNumber(ip);
  if (!net || value === null) return false;
  return ((value & net.mask) >>> 0) === net.base;
}

export interface InterfaceNet {
  interface: string;
  cidr: string;
}

/**
 * Build the unique count of clients reachable behind each interface.
 *
 * Sources, merged so a device is only counted once per interface:
 *  - wireless registration-table (exact interface match)
 *  - ARP entries inside the interface subnet
 *  - DHCP leases inside the interface subnet
 *  - hotspot active sessions inside the interface subnet
 */
export function buildClientCounts(opts: {
  interfaces: Record<string, string>[];
  addresses: { address: string; interface: string }[];
  wireless: { interface?: string }[];
  arp: { address: string; interface?: string }[];
  leases: { address: string }[];
  hotspotActive: { address: string }[];
}): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (name: string) => counts.set(name, (counts.get(name) || 0) + 1);

  // Unique identity per client: MAC when known, otherwise the IP address.
  const seenByInterface = new Map<string, Set<string>>();

  const add = (iface: string | undefined, identity: string) => {
    if (!iface || !identity) return;
    if (!seenByInterface.has(iface)) seenByInterface.set(iface, new Set());
    const set = seenByInterface.get(iface)!;
    if (set.has(identity)) return;
    set.add(identity);
    bump(iface);
  };

  const subnetsByInterface = new Map<string, string[]>();
  for (const a of opts.addresses) {
    if (!a.interface || !a.address) continue;
    const list = subnetsByInterface.get(a.interface) || [];
    list.push(a.address);
    subnetsByInterface.set(a.interface, list);
  }

  const subnetsFor = (iface: string): string[] =>
    subnetsByInterface.get(iface) || [];

  // 1) Wireless: the router tells us the interface directly.
  for (const w of opts.wireless) {
    const iface = w.interface;
    if (!iface) continue;
    add(iface, `mac:${String((w as Record<string, unknown>)["mac-address"] || "")}`);
  }

  // 2) ARP: prefer the router's own interface column, otherwise match subnets.
  for (const entry of opts.arp) {
    if (!entry.address) continue;
    const mac = String((entry as Record<string, unknown>)["mac-address"] || "");
    const identity = mac ? `mac:${mac}` : `ip:${entry.address}`;
    if (entry.interface) {
      add(entry.interface, identity);
      continue;
    }
    for (const iface of opts.interfaces.map((i) => i.name).filter(Boolean)) {
      if (subnetsFor(iface).some((cidr) => isInSubnet(entry.address, cidr))) {
        add(iface, identity);
      }
    }
  }

  // 3) DHCP leases and hotspot sessions have no interface column: match subnet.
  for (const lease of opts.leases) {
    if (!lease.address) continue;
    const mac = String((lease as Record<string, unknown>)["mac-address"] || "");
    const identity = mac ? `mac:${mac}` : `ip:${lease.address}`;
    for (const iface of opts.interfaces.map((i) => i.name).filter(Boolean)) {
      if (subnetsFor(iface).some((cidr) => isInSubnet(lease.address, cidr))) {
        add(iface, identity);
      }
    }
  }

  for (const session of opts.hotspotActive) {
    if (!session.address) continue;
    const mac = String((session as Record<string, unknown>)["mac-address"] || "");
    const identity = mac ? `mac:${mac}` : `ip:${session.address}`;
    for (const iface of opts.interfaces.map((i) => i.name).filter(Boolean)) {
      if (subnetsFor(iface).some((cidr) => isInSubnet(session.address, cidr))) {
        add(iface, identity);
      }
    }
  }

  return counts;
}