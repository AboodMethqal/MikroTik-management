import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Dev-only Node utility outside the app bundle (CommonJS require is correct there).
    "check-db.cjs",
  ]),
  {
    rules: {
      // Next 16 / React 19 newly flags the standard fetch-on-mount + polling
      // pattern (useEffect that loads external data and calls setState) as an
      // error. Every dashboard page intentionally syncs external RouterOS/DB
      // state on mount and on polling intervals, which is exactly what effects
      // are for. Keep it visible as a warning instead of an error so
      // `npm run lint` reflects real defects rather than this style rule.
      "react-hooks/set-state-in-effect": "warn",
      // RouterOS API responses are dynamic string maps; several API routes and
      // pages still carry `any` from earlier development. TypeScript strict
      // checking (`npm run typecheck`) already passes. Track remaining `any`
      // usages as warnings while boundaries are typed incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
