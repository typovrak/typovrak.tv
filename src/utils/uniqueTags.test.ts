import { describe, expect, it } from "vitest";
import { uniqueTags } from "./uniqueTags";

describe("uniqueTags", () => {
  it("pairs each tag with its slug", () => {
    expect(uniqueTags(["Arch Linux"])).toEqual([
      { tag: "arch-linux", tagName: "Arch Linux" },
    ]);
  });

  it("collapses case-variant labels into one tag", () => {
    expect(uniqueTags(["Docker", "docker"])).toEqual([
      { tag: "docker", tagName: "Docker" },
    ]);
  });

  it("keeps the first label seen on a collision", () => {
    expect(uniqueTags(["docker", "Docker"])[0].tagName).toBe("docker");
  });

  it("sorts by slug, not by insertion order", () => {
    expect(uniqueTags(["neovim", "arch", "docker"]).map(t => t.tag)).toEqual([
      "arch",
      "docker",
      "neovim",
    ]);
  });

  it("deduplicates across many posts' tags", () => {
    const allTags = ["cli", "tools", "cli", "neovim", "tools", "cli"];
    expect(uniqueTags(allTags).map(t => t.tag)).toEqual([
      "cli",
      "neovim",
      "tools",
    ]);
  });

  it("returns nothing for no tags", () => {
    expect(uniqueTags([])).toEqual([]);
  });
});
