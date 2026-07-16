import { describe, expect, it } from "vitest";
import { slugifyStr, slugifyAll } from "./slugify";

describe("slugifyStr", () => {
  it("lowercases and turns spaces into dashes", () => {
    expect(slugifyStr("E2E Testing")).toBe("e2e-testing");
    expect(slugifyStr("Arch Linux")).toBe("arch-linux");
  });

  it("collapses case, so Docker and docker are one tag", () => {
    expect(slugifyStr("Docker")).toBe(slugifyStr("docker"));
  });

  it("strips accents to their base letter", () => {
    expect(slugifyStr("café münchen")).toBe("cafe-munchen");
    expect(slugifyStr("Léon & Zoé")).toBe("leon-zoe");
  });

  it("keeps only a-z, 0-9 and dashes", () => {
    expect(slugifyStr("C++")).toBe("c");
    expect(slugifyStr("Node.js")).toBe("node-js");
    expect(slugifyStr("2024/report")).toBe("2024-report");
  });

  it("never produces two dashes in a row", () => {
    expect(slugifyStr("Hello -- World")).toBe("hello-world");
    expect(slugifyStr("a---b")).toBe("a-b");
  });

  it("trims leading and trailing dashes and whitespace", () => {
    expect(slugifyStr("  spaced  ")).toBe("spaced");
    expect(slugifyStr("  --Léon!!  ")).toBe("leon");
  });

  it("drops characters with no base letter (site is English-only)", () => {
    expect(slugifyStr("日本語 tag")).toBe("tag");
  });

  it("returns an empty string when nothing survives", () => {
    expect(slugifyStr("...")).toBe("");
  });

  it("leaves an already-slug string unchanged (idempotent)", () => {
    expect(slugifyStr("already-kebab")).toBe("already-kebab");
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
