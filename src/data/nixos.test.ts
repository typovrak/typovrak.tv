import { describe, it, expect } from "vitest";
import {
  categoryStats,
  sortCategoriesByPopularity,
  type NixosCategory,
} from "./nixos";
import type { RepoStats } from "./githubRepos";

const category = (title: string, ...modules: string[]): NixosCategory => ({
  title,
  icon: "wrench",
  modules: modules.map(name => ({ name, purpose: "" })),
});

// injected rather than read from github-repos.json, which the daily workflow
// rewrites and would make these assertions drift
const lookup =
  (table: Record<string, [number, number]>) =>
  (module: string): RepoStats => {
    const [stars, forks] = table[module] ?? [0, 0];
    return { stars, forks, archived: false };
  };

describe("categoryStats", () => {
  it("sums the stars and forks of every module", () => {
    const stats = categoryStats(
      category("CLI tools", "fzf", "bat"),
      lookup({ fzf: [4, 1], bat: [1, 0] })
    );
    expect(stats).toEqual({ stars: 5, forks: 1, archived: false });
  });

  it("counts a module with no stats as zero rather than throwing", () => {
    expect(categoryStats(category("Audio", "cava"), lookup({}))).toEqual({
      stars: 0,
      forks: 0,
      archived: false,
    });
  });
});

describe("sortCategoriesByPopularity", () => {
  const statsFor = lookup({
    fzf: [4, 1],
    zsh: [3, 0],
    nvim: [1, 0],
    cava: [0, 0],
    gtk: [2, 0],
  });

  it("puts the most stars and forks first", () => {
    const sorted = sortCategoriesByPopularity(
      [
        category("Development", "nvim"),
        category("CLI tools", "fzf"),
        category("Shell", "zsh"),
      ],
      statsFor
    );
    expect(sorted.map(c => c.title)).toEqual([
      "CLI tools",
      "Shell",
      "Development",
    ]);
  });

  it("breaks a tie on the total by preferring stars over forks", () => {
    const sorted = sortCategoriesByPopularity(
      [category("Window manager", "wm"), category("Theming", "gtk")],
      lookup({ wm: [1, 1], gtk: [2, 0] })
    );
    expect(sorted.map(c => c.title)).toEqual(["Theming", "Window manager"]);
  });

  it("falls back to the title so two empty categories keep a stable order", () => {
    const sorted = sortCategoriesByPopularity(
      [category("Audio", "cava"), category("Accessibility", "a11y")],
      statsFor
    );
    expect(sorted.map(c => c.title)).toEqual(["Accessibility", "Audio"]);
  });

  it("leaves the input array untouched", () => {
    const input = [
      category("Development", "nvim"),
      category("CLI tools", "fzf"),
    ];
    sortCategoriesByPopularity(input, statsFor);
    expect(input.map(c => c.title)).toEqual(["Development", "CLI tools"]);
  });
});
