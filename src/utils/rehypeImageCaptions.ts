// Wraps a standalone content image in <figure> and gives it a <figcaption>
// built from the alt text, so every image carries a visible caption. A
// paragraph qualifies when its only non-whitespace child is an <img> with a
// non-empty alt. Inline images (mixed with text) and alt-less images are left
// alone. The alt stays on the <img>, so it still serves SEO and screen readers;
// the caption reuses it, keeping one source of truth.
//
// An optional width hint in the src caps the figure: `image.avif#w400` renders
// at most 400px wide (centred by the figure's own margins). The hint is stripped
// from the src so the file still resolves.

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const isBlank = (node: HastNode): boolean =>
  node.type === "text" && (node.value ?? "").trim() === "";

function visit(node: HastNode): void {
  if (node.type === "element" && node.tagName === "p" && node.children) {
    const meaningful = node.children.filter(child => !isBlank(child));
    const only = meaningful[0];
    if (
      meaningful.length === 1 &&
      only.type === "element" &&
      only.tagName === "img" &&
      typeof only.properties?.alt === "string" &&
      only.properties.alt.trim() !== ""
    ) {
      const src = only.properties.src;
      const width =
        typeof src === "string" ? /#w(\d+)$/.exec(src)?.[1] : undefined;
      if (typeof src === "string" && width) {
        only.properties.src = src.replace(/#w\d+$/, "");
      }

      node.tagName = "figure";
      node.properties = {
        ...(node.properties ?? {}),
        ...(width ? { style: `max-width:${width}px` } : {}),
      };
      node.children = [
        only,
        {
          type: "element",
          tagName: "figcaption",
          properties: {},
          children: [{ type: "text", value: only.properties.alt }],
        },
      ];
    }
  }
  node.children?.forEach(visit);
}

export function rehypeImageCaptions() {
  return (tree: HastNode): void => visit(tree);
}
