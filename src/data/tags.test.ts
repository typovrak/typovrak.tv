import { describe, expect, it } from "vitest";
import { tagInfo, tags } from "./tags";

describe("tagInfo", () => {
  it("returns the registered entry", () => {
    expect(tagInfo("neovim").label).toBe("Neovim");
  });

  it("throws on an unknown tag, naming it so the build error is actionable", () => {
    expect(() => tagInfo("not-a-real-tag")).toThrow(/not-a-real-tag/);
  });
});

describe("the registry", () => {
  it("gives every tag a label, a description and an icon", () => {
    for (const [slug, info] of Object.entries(tags)) {
      expect(info.label, slug).toBeTruthy();
      expect(info.description, slug).toBeTruthy();
      expect(info.icon, slug).toBeTruthy();
    }
  });

  it("is keyed by slug, so the keys match the URLs", () => {
    for (const slug of Object.keys(tags)) {
      expect(slug, slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
