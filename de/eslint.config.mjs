import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Eigene Konfiguration für diese App.
 *
 * Dieselbe Form wie im Repository darüber, aber eine eigene Datei — sonst
 * wäre es wieder eine gemeinsame, und genau das soll die Trennung nicht.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
