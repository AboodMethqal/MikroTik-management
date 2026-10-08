import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/crypto";
import type { AppRole } from "@/lib/permissions";

function envCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username || "").trim();
        const password = String(credentials?.password || "");
        if (!username || !password) return null;

        try {
          const dbUser = await prisma.adminUser.findUnique({ where: { username } });
          if (dbUser) {
            if (!dbUser.active || !verifyPassword(password, dbUser.passwordHash)) return null;
            await prisma.adminUser.update({ where: { id: dbUser.id }, data: { lastLoginAt: new Date() } });
            return { id: dbUser.id, name: dbUser.username, email: `${dbUser.username}@mikhmon.local`, role: dbUser.role as AppRole };
          }
        } catch {
          // Fall back to environment bootstrap credentials when the database is unavailable.
        }

        const env = envCredentials();
        if (env && username === env.username && password === env.password) {
          return { id: "env-admin", name: username, email: `${username}@mikhmon.local`, role: "SUPER_ADMIN" as AppRole };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: AppRole }).role || "VIEWER";
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.role = (token.role as AppRole) || "VIEWER";
      return session;
    },
    authorized: async ({ auth }) => !!auth,
  },
});

export { hashPassword };
