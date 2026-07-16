// Minimal rehype plugin: open external links in a new tab, hardened against
// reverse-tabnabbing. Replaces the rehype-external-links package. External =
// an absolute http(s) URL; relative links and mailto: are left alone.

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const isExternal = (href: unknown): href is string =>
  typeof href === "string" && /^https?:\/\//i.test(href);

function visit(node: HastNode): void {
  if (node.type === "element" && node.tagName === "a") {
    const props = (node.properties ??= {});
    if (isExternal(props.href)) {
      props.target = "_blank";
      props.rel = ["noopener", "noreferrer"];
    }
  }
  node.children?.forEach(visit);
}

export function rehypeExternalLinks() {
  return (tree: HastNode): void => visit(tree);
}
