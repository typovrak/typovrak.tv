// The NixOS config is one repo per tool. This lists them grouped by purpose;
// each module lives at github.com/typovrak/nixos-<name>, the umbrella config at
// github.com/typovrak/nixos. Stars, forks and the archived flag are not stored
// here: they come from github-repos.json, refreshed daily by the GitHub data
// workflow.
import repoStats from "./github-repos.json";

const owner = "https://github.com/typovrak";

export const nixosRepoUrl = `${owner}/nixos`;

export const moduleUrl = (name: string) => `${owner}/nixos-${name}`;

export type RepoStats = { stars: number; forks: number; archived: boolean };

const stats: Record<string, RepoStats> = repoStats;

const empty: RepoStats = { stars: 0, forks: 0, archived: false };

export const repoStatsFor = (repo: string): RepoStats => stats[repo] ?? empty;

export const moduleStatsFor = (name: string): RepoStats =>
  repoStatsFor(`nixos-${name}`);

export type NixosModule = {
  name: string;
  purpose: string;
};

export type NixosCategory = {
  title: string;
  modules: NixosModule[];
};

export const nixosCategories: NixosCategory[] = [
  {
    title: "Window manager and desktop",
    modules: [
      {
        name: "i3",
        purpose: "i3 window manager with Catppuccin Mocha green styling",
      },
      {
        name: "i3lock-color",
        purpose: "i3lock-color screen locker, Catppuccin Mocha green",
      },
      {
        name: "polybar",
        purpose:
          "Polybar status bar, Catppuccin Mocha green, with helper scripts and an OBS indicator",
      },
      {
        name: "lightdm",
        purpose:
          "LightDM GTK greeter with a custom icon, wallpaper and theme accents",
      },
      {
        name: "launchers",
        purpose: "Desktop application launchers and MIME type associations",
      },
      {
        name: "screenkey",
        purpose: "Screenkey keystroke display with a per-user config",
      },
    ],
  },
  {
    title: "Terminal",
    modules: [
      {
        name: "alacritty",
        purpose: "Alacritty terminal, Catppuccin Mocha green, per-user config",
      },
      {
        name: "ghostty",
        purpose: "Ghostty terminal, Catppuccin Mocha green, with custom CSS",
      },
      { name: "zellij", purpose: "Zellij terminal multiplexer" },
    ],
  },
  {
    title: "Shell",
    modules: [
      {
        name: "bash",
        purpose: "Nix's Bash as /bin/bash for a consistent system shell",
      },
      {
        name: "zsh",
        purpose: "zsh with plugins, prompt, aliases and an SSH agent",
      },
    ],
  },
  {
    title: "Development",
    modules: [
      {
        name: "nvim",
        purpose:
          "Neovim with a Lua config, Catppuccin Mocha green theme and core plugins",
      },
      { name: "git", purpose: "Git with a per-user .gitconfig" },
      {
        name: "lazygit",
        purpose: "LazyGit terminal UI with a per-user config",
      },
      { name: "gh", purpose: "GitHub CLI with a per-user config" },
    ],
  },
  {
    title: "CLI tools",
    modules: [
      {
        name: "bat",
        purpose: "bat, a cat clone with syntax highlighting, Catppuccin Mocha",
      },
      { name: "htop", purpose: "htop process monitor with a per-user config" },
      {
        name: "btop",
        purpose: "btop resource monitor, Catppuccin Mocha green",
      },
      {
        name: "yazi",
        purpose: "Yazi file manager with themes and color schemes",
      },
      {
        name: "fastfetch",
        purpose: "Fastfetch system info with a per-user config",
      },
      {
        name: "neofetch",
        purpose: "Neofetch system info with a per-user config",
      },
    ],
  },
  {
    title: "Audio",
    modules: [
      {
        name: "audio",
        purpose:
          "PipeWire audio stack with WirePlumber, ALSA and real-time scheduling",
      },
      {
        name: "pavucontrol",
        purpose: "Pavucontrol volume control with per-user settings",
      },
      { name: "cava", purpose: "CAVA console audio visualizer" },
    ],
  },
  {
    title: "Theming and fonts",
    modules: [
      {
        name: "gtk",
        purpose:
          "GTK 2, 3 and 4 with Catppuccin Mocha green, Papirus icons and cursors",
      },
      {
        name: "stylus",
        purpose:
          "Stylus userstyles (Catppuccin Mocha green) for Chromium and Firefox",
      },
      {
        name: "fonts",
        purpose: "JetBrainsMono Nerd Font and emoji, system-wide",
      },
    ],
  },
  {
    title: "System",
    modules: [
      {
        name: "locale",
        purpose: "Timezone and locale, en_US base with French regional formats",
      },
      {
        name: "ssh",
        purpose: "A secured ~/.ssh, OpenSSH and the SSH service",
      },
      { name: "flatpak", purpose: "Flatpak with Flathub and OBS Studio" },
      { name: "nemo", purpose: "A secured per-user Nemo config directory" },
      {
        name: "projects",
        purpose: "A per-user ~/projects directory with secure ownership",
      },
    ],
  },
];

export const moduleCount = nixosCategories.reduce(
  (total, category) => total + category.modules.length,
  0
);

// Cumulative stars across the umbrella repo and every module.
export const totalStars = Object.values(stats).reduce(
  (total, repo) => total + repo.stars,
  0
);
