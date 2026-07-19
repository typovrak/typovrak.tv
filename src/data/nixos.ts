// The NixOS config is one repo per tool. This lists them grouped by purpose;
// each module lives at github.com/typovrak/nixos-<name>, the umbrella config at
// github.com/typovrak/nixos. Stars, forks and the archived flag are not stored
// here: they come from githubRepos.
import { repoStatsFor, type RepoStats } from "./githubRepos";

const owner = "https://github.com/typovrak";

export const nixosRepoUrl = `${owner}/nixos`;

// NixOS release every module currently targets. Overridden per module only for
// exceptions (see nixos below on each entry).
export const nixosVersion = "26.05";

export const moduleUrl = (name: string) => `${owner}/nixos-${name}`;

export const moduleStatsFor = (name: string): RepoStats =>
  repoStatsFor(`nixos-${name}`);

// The more stars and forks, the more visible the card: accent border and a
// rising accent background tint. The tint stays light so text contrast holds;
// 0 falls back to the neutral border.
export const popularityCard = (repo: RepoStats): string => {
  const score = repo.stars + repo.forks;
  if (score >= 6) return "border-accent bg-accent/15";
  if (score >= 3) return "border-accent/60 bg-accent/10";
  if (score >= 1) return "border-accent/30 bg-accent/5";
  return "border-border";
};

export type NixosModule = {
  name: string;
  purpose: string;
  // Supported NixOS release, only when it differs from nixosVersion.
  nixos?: string;
};

export const moduleNixos = (module: NixosModule): string =>
  module.nixos ?? nixosVersion;

export type NixosCategory = {
  title: string;
  // Lucide icon name, rendered by CategoryIcon.
  icon: string;
  modules: NixosModule[];
};

export const nixosCategories: NixosCategory[] = [
  {
    title: "Window manager and desktop",
    icon: "app-window",
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
    icon: "square-terminal",
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
    icon: "chevrons-right",
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
    icon: "code-xml",
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
    icon: "wrench",
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
        nixos: "24.11",
      },
    ],
  },
  {
    title: "Audio",
    icon: "audio-lines",
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
    icon: "palette",
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
    icon: "cpu",
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

const allModules = nixosCategories.flatMap(category => category.modules);

export const moduleCount = allModules.length;

// Cumulative stars and forks across the umbrella repo and every module. Scoped
// to nixos repos on purpose, so external repos in githubRepos never leak in.
const nixosRepos = [
  repoStatsFor("nixos"),
  ...allModules.map(module => moduleStatsFor(module.name)),
];

export const totalStars = nixosRepos.reduce(
  (total, repo) => total + repo.stars,
  0
);

export const totalForks = nixosRepos.reduce(
  (total, repo) => total + repo.forks,
  0
);
