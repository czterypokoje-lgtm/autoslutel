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
    // de/ is its own app with its own eslint config and its own node_modules.
    // Linting it from here resolves nothing and reports every @/ import as
    // missing — keeping the two apps apart is the point of that folder.
    "de/**",
  ]),
]);

export default eslintConfig;
