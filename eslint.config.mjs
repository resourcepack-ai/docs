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
    // Not defaults — OpenNext's build output. It's a bundle of Next's own
    // server code, so once you've run a Cloudflare build it drowns
    // `npm run lint` in thousands of problems from files nobody wrote.
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
