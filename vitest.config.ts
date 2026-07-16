import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Coverage measures the pure modules we commit to unit-testing. The
      // wiring modules below import astro:* and are verified by the build diff,
      // not unit tests (see the Tests section in CLAUDE.md), so including them
      // would report a misleading near-zero.
      include: ["src/utils/**/*.ts", "src/pages/**/_utils/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "src/utils/db.ts",
        "src/utils/getPostPaths.ts",
        "src/utils/getSortedPosts.ts",
        "src/utils/getUniqueTags.ts",
        "src/utils/knownPaths.ts",
        "src/utils/postFilter.ts",
        "src/utils/resolveDefaultOgImagePath.ts",
        "src/utils/getFontPathByWeight.ts",
        "src/utils/withBase.ts",
      ],
    },
  },
});
