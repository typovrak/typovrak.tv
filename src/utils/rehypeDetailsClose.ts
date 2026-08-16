// appends a close button before each </details> so a long disclosure can be
// collapsed from the bottom. both disclosures arrive as raw html (the toc from
// remark-collapse, content blocks authored inline), so the raw path is the real
// one; the element path is a fallback. the button is wired by detailsClose.ts.

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const CLOSE_TAG = "</details>";
const BUTTON_HTML =
  '<button type="button" class="details-close" aria-label="Close this section">Close</button>';

const hasCloseButton = (node: HastNode): boolean =>
  (node.children ?? []).some(
    child =>
      child.type === "element" &&
      child.tagName === "button" &&
      Array.isArray(child.properties?.className) &&
      (child.properties.className as unknown[]).includes("details-close")
  );

function visit(node: HastNode): void {
  if (
    node.type === "raw" &&
    typeof node.value === "string" &&
    node.value.includes(CLOSE_TAG) &&
    !node.value.includes("details-close")
  ) {
    node.value = node.value.split(CLOSE_TAG).join(BUTTON_HTML + CLOSE_TAG);
  }

  if (
    node.type === "element" &&
    node.tagName === "details" &&
    node.children &&
    !hasCloseButton(node)
  ) {
    node.children.push({
      type: "element",
      tagName: "button",
      properties: {
        type: "button",
        className: ["details-close"],
        "aria-label": "Close this section",
      },
      children: [{ type: "text", value: "Close" }],
    });
  }

  node.children?.forEach(visit);
}

export function rehypeDetailsClose() {
  return (tree: HastNode): void => visit(tree);
}
