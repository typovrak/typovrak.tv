// wraps a standalone content image in <figure> + <figcaption> from its alt.
// a `#wNNN` hint in the src caps the figure width and is stripped off.

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
