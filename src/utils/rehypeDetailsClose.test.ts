import { describe, it, expect } from "vitest";
import { rehypeDetailsClose } from "./rehypeDetailsClose";

const root = (children: unknown[]) => ({
  type: "root",
  children,
});

const details = (children: unknown[]) => ({
  type: "element",
  tagName: "details",
  properties: {},
  children,
});

const summary = {
  type: "element",
  tagName: "summary",
  properties: {},
  children: [{ type: "text", value: "More" }],
};

const run = (tree: unknown) => {
  rehypeDetailsClose()(tree as never);
  return tree as { children: any[] };
};

describe("rehypeDetailsClose", () => {
  it("inserts a close button before a raw closing </details> tag", () => {
    const tree = run(root([{ type: "raw", value: "</details>" }]));
    const value = tree.children[0].value as string;
    expect(value).toContain('class="details-close"');
    expect(value.trim().endsWith("</details>")).toBe(true);
    // the button sits inside the disclosure, before the closing tag
    expect(value.indexOf("details-close")).toBeLessThan(
      value.indexOf("</details>")
    );
  });

  it("does not double-insert into a raw node already carrying the button", () => {
    const already = `${'<button class="details-close">Close</button>'}</details>`;
    const tree = run(root([{ type: "raw", value: already }]));
    const count = (tree.children[0].value.match(/details-close/g) || []).length;
    expect(count).toBe(1);
  });

  it("appends a close button to a parsed details element", () => {
    const tree = details([summary, { type: "text", value: "body" }]);
    run(tree);
    const last = (tree.children as any[]).at(-1);
    expect(last.tagName).toBe("button");
    expect(last.properties.className).toContain("details-close");
    expect(last.children[0].value).toBe("Close");
  });

  it("leaves raw nodes without a closing tag alone", () => {
    const tree = run(root([{ type: "raw", value: "<p>hello</p>" }]));
    expect(tree.children[0].value).toBe("<p>hello</p>");
  });
});
