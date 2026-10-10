import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Native/database drivers must stay external so their platform bindings are
  // loaded from node_modules at runtime instead of being bundled.
  serverExternalPackages: [
    "node-routeros",
    "better-sqlite3",
    "@libsql/client",
    "@prisma/adapter-libsql",
    "@prisma/adapter-better-sqlite3",
    "@prisma/adapter-pg",
  ],

  // Pin the workspace root to this project: a stray stub lockfile in the
  // parent folder otherwise makes Next infer the wrong root.
  turbopack: {
    root: process.cwd(),
  },

  // Security headers for all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
