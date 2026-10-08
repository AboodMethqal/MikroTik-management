export type AppRole = "SUPER_ADMIN" | "ADMIN" | "NETWORK_ADMIN" | "SALES_MANAGER" | "CASHIER" | "VIEWER";

const permissions: Record<AppRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["*"],
  NETWORK_ADMIN: ["network.read", "network.write", "router.read", "router.write", "hotspot.read", "hotspot.write", "user-manager.read", "user-manager.write", "printing.read", "printing.write", "system.read", "system.write"],
  SALES_MANAGER: ["sales.read", "sales.write", "pos.read", "pos.write", "printing.read", "printing.write"],
  CASHIER: ["sales.read", "sales.write", "pos.read", "pos.write", "printing.read"],
  VIEWER: ["network.read", "router.read", "hotspot.read", "user-manager.read", "sales.read", "pos.read", "printing.read", "system.read"],
};

export function can(role: string | undefined, permission: string) {
  if (!role) return false;
  const list = permissions[role as AppRole] || [];
  return list.includes("*") || list.includes(permission);
}
