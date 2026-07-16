import { describe, expect, it } from "vitest";
import { rehypeExternalLinks } from "./rehypeExternalLinks";

// Minimal hast helpers.
interface Anchor {
  type: string;
  tagName: string;
  properties: Record<string, unknown>;
  children: unknown[];
}
const a = (href: string): Anchor => ({
  type: "element",
  tagName: "a",
  properties: { href },
  children: [],
});
const tree = (...children: unknown[]) => ({ type: "root", children });

const run = (node: unknown): Anchor => {
  rehypeExternalLinks()(node as never);
  return node as Anchor;
};

describe("rehypeExternalLinks", () => {
  it("opens an external http(s) link in a new tab, hardened", () => {
    const link = run(a("https://example.com/x"));
    expect(link.properties.target).toBe("_blank");
    expect(link.properties.rel).toEqual(["noopener", "noreferrer"]);
  });

  it("leaves relative links untouched", () => {
    const link = run(a("/about"));
    expect(link.properties.target).toBeUndefined();
    expect(link.properties.rel).toBeUndefined();
  });

  it("leaves mailto and other schemes untouched", () => {
    for (const href of ["mailto:x@y.tld", "tel:+33", "#anchor", "ftp://h/x"]) {
      const link = run(a(href));
      expect(link.properties.target).toBeUndefined();
    }
  });

  it("walks nested children", () => {
    const link = a("https://example.com");
    run(tree({ type: "element", tagName: "p", children: [link] }));
    expect(link.properties.target).toBe("_blank");
  });

  it("is case-insensitive on the scheme", () => {
    expect(run(a("HTTPS://EXAMPLE.COM")).properties.target).toBe("_blank");
  });
});
