import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/permissions";

declare module "next-auth" {
  interface User { role?: AppRole; }
  interface Session { user: { role: AppRole } & DefaultSession["user"]; }
}

declare module "next-auth/jwt" {
  interface JWT { role?: AppRole; }
}
