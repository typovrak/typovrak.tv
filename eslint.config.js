import eslintPluginAstro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
  },
  { rules: { "no-console": "error" } },
  // Build scripts run in a terminal; console output is the point.
  { files: ["scripts/**"], rules: { "no-console": "off" } },
  // API routes run on the server, where logging a failed third-party call is
  // the only way to diagnose it.
  { files: ["src/pages/api/**"], rules: { "no-console": "off" } },
  {
    ignores: [
      "dist/**",
      ".astro/**",
      ".vercel/**",
      "public/pagefind/**",
      "coverage/**",
      ".unlighthouse/**",
    ],
  },
];
