export interface MikrotikRouter {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  hotspotName: string;
  dnsName: string;
  currency: string;
  autoReload: number;
  createdAt: string;
  updatedAt: string;
  /** True only for the built-in virtual (mock) demo router. */
  isMock: boolean;
}

export interface RouterConfig {
  admin: {
    username: string;
    password: string;
  };
  routers: MikrotikRouter[];
}
