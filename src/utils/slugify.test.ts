import { describe, expect, it } from "vitest";
import { slugifyStr, slugifyAll } from "./slugify";

describe("slugifyStr", () => {
  it("lowercases and hyphenates a latin string", () => {
    expect(slugifyStr("E2E Testing")).toBe("e2e-testing");
    expect(slugifyStr("Arch Linux")).toBe("arch-linux");
  });

  it("collapses case, so Docker and docker are one tag", () => {
    expect(slugifyStr("Docker")).toBe(slugifyStr("docker"));
  });

  it("strips accents on a non-latin string via kebabcase", () => {
    expect(slugifyStr("café münchen")).toBe("cafe-munchen");
  });

  it("keeps non-latin scripts rather than dropping them", () => {
    expect(slugifyStr("日本語 tag")).toBe("日本語-tag");
  });

  it("trims surrounding whitespace", () => {
    expect(slugifyStr("  spaced  ")).toBe("spaced");
  });

  it("leaves an already-kebab string unchanged", () => {
    expect(slugifyStr("already-kebab")).toBe("already-kebab");
  });

  it("is idempotent", () => {
    for (const s of ["E2E Testing", "café münchen", "Arch Linux"]) {
      expect(slugifyStr(slugifyStr(s))).toBe(slugifyStr(s));
    }
  });
});

describe("slugifyAll", () => {
  it("slugifies each element", () => {
    expect(slugifyAll(["Arch Linux", "CLI"])).toEqual(["arch-linux", "cli"]);
  });
});
