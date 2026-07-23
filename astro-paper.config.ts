import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://typovrak.tv/",
    title: "typovrak",
    description:
      "Notes on Arch Linux, NixOS, CLI tooling and web development, written up from problems I had to solve myself.",
    keywords:
      "linux, arch linux, nixos, cli, terminal, neovim, docker, web development, astro, typescript, self-hosting",
    author: "typovrak",
    profile: "https://github.com/typovrak",
    lang: "en",
    timezone: "Europe/Paris",
    dir: "ltr",
    ogImage: "typovrak-banner-hobbies-radius-min.png",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    // No posts yet, so nothing to archive. Re-enable once there are posts.
    showArchives: false,
    showBackButton: true,
    search: "pagefind",
  },
  // giscus comments. These IDs are public (they ship in the page HTML), so
  // they live here, not in .env.
  comments: {
    repo: "typovrak/typovrak.tv",
    repoId: "R_kgDOO9Us_w",
    category: "Comments",
    categoryId: "DIC_kwDOO9Us_84DBNio",
  },
  socials: [
    { name: "github", url: "https://github.com/typovrak" },
    { name: "mail", url: "mailto:typovrak@gmail.com" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});