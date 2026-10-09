import { cookies } from "next/headers";
import { encryptSessionData, decryptSessionData } from "./crypto";
import { createRouterClient } from "./router-factory";
import type { RouterOSConfig } from "./routeros";

const SESSION_COOKIE_NAME = "mikhmon_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export interface RouterSessionData {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string;
  hotspotName?: string;
  currency?: string;
  /** True when the active router is the built-in virtual demo router. */
  isMock?: boolean;
}

/**
 * Save router session to encrypted cookie
 */
export async function setRouterSession(data: RouterSessionData): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = encryptSessionData(data);

  cookieStore.set(SESSION_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Get decrypted router session from cookie
 */
export async function getRouterSession(): Promise<RouterSessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  return decryptSessionData<RouterSessionData>(sessionCookie.value);
}

/**
 * Clear router session cookie
 */
export async function clearRouterSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if router session exists and is valid
 */
export async function hasValidRouterSession(): Promise<boolean> {
  const session = await getRouterSession();
  return session !== null;
}

/**
 * Get authenticated RouterOS client from session
 * Returns null if no session or connection fails
 */
export async function getAuthenticatedClient() {
  const session = await getRouterSession();

  if (!session) {
    return { client: null, error: "No active session" };
  }

  try {
    const config: RouterOSConfig = {
      host: session.host,
      port: session.port,
      user: session.user,
      password: session.password,
    };

    const client = createRouterClient({ ...config, mock: session.isMock === true });
    const connected = await client.connect();

    if (!connected) {
      return { client: null, error: session.isMock ? "Mock router is not connected (check mock status)" : "Failed to connect to MikroTik" };
    }

    return { client, error: null, session };
  } catch (error) {
    console.error("RouterOS connection error:", error);
    return { client: null, error: error instanceof Error ? error.message : "Connection error" };
  }
}
