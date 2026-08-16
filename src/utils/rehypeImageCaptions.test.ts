import { describe, it, expect } from "vitest";
import { rehypeImageCaptions } from "./rehypeImageCaptions";

const img = (alt: string) => ({
  type: "element",
  tagName: "img",
  properties: { src: "/x.avif", alt },
  children: [],
});

const para = (children: unknown[]) => ({
  type: "element",
  tagName: "p",
  properties: {},
  children,
});

const run = (tree: unknown) => {
  rehypeImageCaptions()(tree as never);
  return tree as ReturnType<typeof para>;
};

describe("rehypeImageCaptions", () => {
  it("wraps a standalone image in a figure with a figcaption from its alt", () => {
    const tree = para([img("A GNOME desktop")]);
    run(tree);
    expect(tree.tagName).toBe("figure");
    const [image, caption] = tree.children as any[];
    expect(image.tagName).toBe("img");
    expect(caption.tagName).toBe("figcaption");
    expect(caption.children[0].value).toBe("A GNOME desktop");
    // the alt must stay on the image for SEO and screen readers
    expect(image.properties.alt).toBe("A GNOME desktop");
  });

  it("tolerates whitespace text nodes around the image", () => {
    const tree = para([
      { type: "text", value: "\n" },
      img("caption"),
      { type: "text", value: "\n" },
    ]);
    run(tree);
    expect(tree.tagName).toBe("figure");
    expect((tree.children as any[]).map(c => c.tagName)).toEqual([
      "img",
      "figcaption",
    ]);
  });

  it("leaves an image with an empty alt untouched", () => {
    const tree = para([img("")]);
    run(tree);
    expect(tree.tagName).toBe("p");
    expect((tree.children as any[])[0].tagName).toBe("img");
  });

  it("leaves an inline image (mixed with text) untouched", () => {
    const tree = para([{ type: "text", value: "see " }, img("inline")]);
    run(tree);
    expect(tree.tagName).toBe("p");
  });

  it("caps the figure from a #wNNN hint and strips it off the src", () => {
    const image = img("zoxide");
    image.properties.src = "/img/zoxide.avif#w400";
    const tree = para([image]);
    run(tree);
    expect(tree.tagName).toBe("figure");
    expect((tree.properties as any).style).toBe("max-width:400px");
    // the hint is gone, so the file still resolves
    expect((tree.children as any[])[0].properties.src).toBe("/img/zoxide.avif");
  });

  it("adds no width style when the src has no hint", () => {
    const tree = para([img("plain")]);
    run(tree);
    expect((tree.properties as any).style).toBeUndefined();
  });
});
