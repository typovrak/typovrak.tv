import { describe, it, expect } from "vitest";
import { parsePostBody, stripMdx } from "./postTree";
import { renderTree, plain, textOf } from "./terminal";

const SITE = "https://typovrak.tv";

const MDX = `import Player from "@/components/Player.astro";

Intro paragraph.

export const markers = [
  [0.2, "gh issue create"],
  [46.0, "gh issue develop"],
];

<Player
  src="/casts/a.cast"
  thumbnail={{ src: "/img/a.avif", width: 10 }}
/>

## Table of contents

## What happens?

Text with \`code\` and {/* a comment */} an expression {1 + 1}.

| Strategy | Flag |
| -------- | ---- |
| Rebase   | \`--rebase\` |

> [!TIP] Default to rebase
> Keep history linear.
`;

describe("parsePostBody", () => {
  it("drops mdx imports, exports, jsx and expressions but keeps the prose", async () => {
    const tree = await parsePostBody(MDX, { mdx: true });
    const out = renderTree(tree, { palette: plain, site: SITE });
    expect(out).not.toContain("import ");
    expect(out).not.toContain("markers");
    expect(out).not.toContain("Player");
    expect(out).not.toContain("a comment");
    expect(out).not.toContain("1 + 1");
    expect(out).toContain("Intro paragraph.");
    expect(out).toContain(
      "Text with code and  an expression .".replace("  ", " ")
    );
  });

  it("parses gfm tables and callouts through the same pipeline as the site", async () => {
    const tree = await parsePostBody(MDX, { mdx: true });
    const out = renderTree(tree, { palette: plain, site: SITE });
    expect(out).toContain("Strategy | Flag");
    expect(out).toContain("Rebase   | --rebase");
    expect(out).toContain("> TIP Default to rebase\n>\n> Keep history linear.");
  });

  it("builds the table of contents from the headings that follow", async () => {
    const tree = await parsePostBody(MDX, { mdx: true });
    const out = renderTree(tree, { palette: plain, site: SITE });
    expect(out).toContain("## Table of contents\n\n- What happens?");
  });

  it("keeps raw <details> html in a .md post instead of reading it as jsx", async () => {
    // the mdx grammar would read {braces} as an expression and drop them
    const md = `Before, with {braces} kept.

<details>
<summary>The reasoning</summary>

- one reason
- another

</details>
`;
    const tree = await parsePostBody(md, { mdx: false });
    const out = renderTree(tree, { palette: plain, site: SITE });
    expect(out).toBe(
      "Before, with {braces} kept.\n\nThe reasoning\n\n- one reason\n- another"
    );
  });

  it("does not use smart quotes, which would rewrite commands", async () => {
    const tree = await parsePostBody(`Run "this" and 'that'.`, { mdx: false });
    expect(textOf(tree)).toBe(`Run "this" and 'that'.`);
  });
});

describe("stripMdx", () => {
  it("unwraps a jsx element around markdown rather than losing its children", () => {
    const tree = stripMdx({
      type: "root",
      children: [
        {
          type: "mdxJsxFlowElement",
          children: [
            { type: "paragraph", children: [{ type: "text", value: "kept" }] },
          ],
        },
        { type: "mdxjsEsm", value: "import x from 'y'" },
      ],
    });
    expect(tree.children?.map(child => child.type)).toEqual(["paragraph"]);
  });
});
