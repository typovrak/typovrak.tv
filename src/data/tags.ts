// Hand-written tag registry. Tags are a controlled vocabulary: every tag used
// in a post must appear here with a label, a description and a Lucide icon.
// tagInfo throws otherwise, so the build fails rather than shipping a tag card
// with no description. Icon names must exist in LucideIcon.astro.

export type TagInfo = {
  label: string;
  description: string;
  icon: string;
};

// Keyed by the slug produced by slugifyStr, which is what the URLs use.
export const tags: Record<string, TagInfo> = {
  "arch-linux": {
    label: "Arch Linux",
    description:
      "Installing, configuring and living with Arch Linux day to day.",
    icon: "cpu",
  },
  astro: {
    label: "Astro",
    description:
      "The Astro framework, from content collections to the build output.",
    icon: "rocket",
  },
  cli: {
    label: "CLI",
    description: "Command line tools and the habits that come with them.",
    icon: "square-terminal",
  },
  docker: {
    label: "Docker",
    description: "Containers, images and reproducible local environments.",
    icon: "container",
  },
  git: {
    label: "git",
    description: "Branches, commits and the history you leave behind you.",
    icon: "git-branch",
  },
  github: {
    label: "GitHub",
    description:
      "Issues, pull requests and the gh CLI that drives them from a terminal.",
    icon: "circle-dot",
  },
  gnome: {
    label: "GNOME",
    description: "The GNOME desktop, its tweaks, extensions and daily use.",
    icon: "app-window",
  },
  linux: {
    label: "Linux",
    description: "The system underneath: kernel, shell and daily plumbing.",
    icon: "terminal",
  },
  neovim: {
    label: "Neovim",
    description: "Editing text at speed: configuration, plugins and motions.",
    icon: "file-code",
  },
  nixos: {
    label: "NixOS",
    description:
      "Declaring a whole machine in Nix, from system config to per-project dev shells.",
    icon: "package",
  },
  "open-source": {
    label: "Open source",
    description:
      "Contributing to other people's projects, and what happens to the patches.",
    icon: "git-pull-request",
  },
  prisma: {
    label: "Prisma",
    description:
      "The Prisma ORM, its generated client and its engine binaries.",
    icon: "database",
  },
  tools: {
    label: "Tools",
    description: "Small programs that earn their place in the toolbox.",
    icon: "wrench",
  },
  typescript: {
    label: "TypeScript",
    description: "Types that catch mistakes before the browser does.",
    icon: "code-xml",
  },
  web: {
    label: "Web",
    description: "Browsers, standards and how pages behave once shipped.",
    icon: "globe",
  },
  zsh: {
    label: "zsh",
    description: "The zsh shell: plugins, prompt, completion and aliases.",
    icon: "chevrons-right",
  },
};

export function tagInfo(slug: string): TagInfo {
  const info = tags[slug];
  if (!info) {
    throw new Error(
      `Unknown tag '${slug}'. Add it to src/data/tags.ts with a label, a description and an icon, or drop it from the post frontmatter.`
    );
  }
  return info;
}
