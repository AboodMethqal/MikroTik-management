/**
 * Router backend factory.
 *
 * Application -> this factory -> { real RouterOS | virtual mock router }.
 *
 * The decision is explicit and one-way:
 *  - a router row flagged `isMock` uses the mock backend, and only when
 *    `MOCK_ROUTER_ENABLED=true`;
 *  - every other router always uses the real `node-routeros` client.
 *
 * There is deliberately NO fallback: a failing real connection stays a real
 * failure and can never be silently served by the mock.
 */
import { createRouterOSClient, type MikrotikClient, type RouterOSConfig } from "./routeros";
import { createMockRouterOSClient, isMockRouterEnabled } from "./mock-router";

export interface RouterConnectionConfig extends RouterOSConfig {
  /** True when the selected router is the built-in virtual demo router. */
  mock?: boolean;
}

/**
 * Returns the client for a router, or throws when mock routers are disabled so a
 * stale mock session can never keep working after the flag is turned off.
 */
export function createRouterClient(config: RouterConnectionConfig): MikrotikClient {
  if (config.mock) {
    if (!isMockRouterEnabled()) {
      throw new Error(
        "Mock router is disabled. Set MOCK_ROUTER_ENABLED=true to use the demo router.",
      );
    }
    return createMockRouterOSClient({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      timeout: config.timeout,
    });
  }
  return createRouterOSClient(config);
}

export type { MikrotikClient, RouterOSConfig };