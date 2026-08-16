import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import { rehypeExternalLinks } from "./src/utils/rehypeExternalLinks";
import { rehypeImageCaptions } from "./src/utils/rehypeImageCaptions";
import { rehypeDetailsClose } from "./src/utils/rehypeDetailsClose";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { postSlugPath } from "./src/utils/postSlug";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import config from "./astro-paper.config";

// Build a `pathname -> last-modified` map for the sitemap. @astrojs/sitemap does
// not know post dates, so we read the frontmatter here and reuse postSlugPath
// (the same pure function getPostUrl uses) so the URLs cannot drift from the
// routes. A post whose id convention we fail to reconstruct simply gets no
// lastmod, never a wrong one.
const BLOG_DIR = "src/content/posts";
function postLastmodMap(): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (dir: string, base = "") => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith("_")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, `${base}${entry.name}/`);
        continue;
      }
      if (!/\.mdx?$/.test(entry.name)) continue;
      const frontmatter = readFileSync(full, "utf8").split("---")[1] ?? "";
      if (/\bdraft:\s*true\b/.test(frontmatter)) continue;
      const pub = frontmatter.match(/pubDatetime:\s*(\S+)/)?.[1];
      const mod = frontmatter.match(/modDatetime:\s*(\S+)/)?.[1];
      const date = mod || pub;
      if (!date) continue;
      const id = base + entry.name.replace(/\.mdx?$/, "");
      map.set(
        `/posts/${postSlugPath(id, full, BLOG_DIR)}`,
        new Date(date).toISOString()
      );
    }
  };
  walk(BLOG_DIR);
  return map;
}
const lastmodByPath = postLastmodMap();

export default defineConfig({
  site: config.site.url,
  adapter: vercel(),
  output: "static",
  trailingSlash: "never",
  devToolbar: { enabled: false },
  integrations: [
    mdx(),
    sitemap({
      // Pages a crawler must not be pointed at. Compared on the normalised
      // pathname, never on a trailing slash, which trailingSlash: never removed
      // and which silently broke the previous archives filter.
      filter: page => {
        const path = new URL(page).pathname.replace(/\/$/, "") || "/";
        // The search page is noindex; listing it here would contradict that.
        if (path === "/search") return false;
        // When archives are off the route serves the 404 body with a 200.
        if (path === "/archives" && config.features?.showArchives === false) {
          return false;
        }
        return true;
      },
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, "") || "/";
        const lastmod = lastmodByPath.get(path);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [
        rehypeCallouts,
        rehypeExternalLinks,
        rehypeImageCaptions,
        rehypeDetailsClose,
      ],
    }),
    shikiConfig: {
      themes: { light: "catppuccin-latte", dark: "catppuccin-mocha" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      DATABASE_URL: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      DISCORD_WEBHOOK_URL: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      BREVO_API_KEY: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
      CAPTCHA_SECRET: envField.string({
        access: "secret",
        context: "server",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
