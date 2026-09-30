import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    "out/**",
    "dist/**",
    ".aws-sam/**",
    ".next/**",
    "review-artifacts/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
