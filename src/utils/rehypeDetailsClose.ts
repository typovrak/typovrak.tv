// Appends a close control to each <details> disclosure so a reader can collapse
// it from the bottom instead of scrolling back up to the summary. The button is
// inert without JS (src/scripts/detailsClose.ts wires it up); native summary
// toggling still works, so this only ever adds capability, never removes it.
//
// Both disclosures on a page arrive as raw HTML nodes, not hast elements: the
// table of contents is emitted by remark-collapse as raw <details> strings, and
// content blocks are authored as raw HTML in markdown. So the main path rewrites
// raw nodes, inserting the button right before each </details>. The element path
// is kept for any disclosure that does reach us parsed.

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
