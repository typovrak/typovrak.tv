import { describe, it, expect } from "vitest";
import {
  absoluteUrl,
  ansi,
  formatDate,
  plain,
  renderIndex,
  renderPost,
  renderTree,
  stripTags,
  visibleLength,
  wrap,
  type Node,
} from "./terminal";

const SITE = "https://typovrak.tv";

const text = (value: string): Node => ({ type: "text", value });
const para = (...children: Node[]): Node => ({ type: "paragraph", children });
const root = (...children: Node[]): Node => ({ type: "root", children });

const plainTree = (tree: Node, width?: number) =>
  renderTree(tree, { palette: plain, site: SITE, width });
const ansiTree = (tree: Node, width?: number) =>
  renderTree(tree, { palette: ansi, site: SITE, width });

describe("wrap", () => {
  const seg = (value: string) => ({ text: value, style: "text" as const });

  it("breaks between words so no line passes the width", () => {
    const lines = wrap([seg("one two three four five six")], 10).map(line =>
      line.map(s => s.text).join("")
    );
    expect(lines).toEqual(["one two", "three four", "five six"]);
    expect(lines.every(line => line.length <= 10)).toBe(true);
  });

  it("keeps a word longer than the width on its own line instead of cutting it", () => {
    const lines = wrap([seg("a supercalifragilistic b")], 8).map(line =>
      line.map(s => s.text).join("")
    );
    expect(lines).toEqual(["a", "supercalifragilistic", "b"]);
  });

  it("collapses runs of whitespace and drops a trailing space", () => {
    const lines = wrap([seg("a   b \n c")], 80).map(line =>
      line.map(s => s.text).join("")
    );
    expect(lines).toEqual(["a b", "c"]);
  });

  it("keeps the style of each word across a break", () => {
    const lines = wrap(
      [seg("plain "), { text: "code", style: "code" }, seg(" tail")],
      12
    );
    expect(lines[0].map(s => s.style)).toContain("code");
    expect(lines[1][0]).toEqual({ text: "tail", style: "text" });
  });
});

describe("renderTree", () => {
  it("wraps a paragraph at the width", () => {
    const out = plainTree(root(para(text("word ".repeat(30).trim()))), 40);
    expect(out.split("\n").every(line => line.length <= 40)).toBe(true);
    expect(out.split("\n").length).toBeGreaterThan(1);
  });

  it("prefixes headings with hashes in plain and colours them in ansi", () => {
    const tree = root({ type: "heading", depth: 2, children: [text("Why?")] });
    expect(plainTree(tree)).toBe("## Why?");
    expect(ansiTree(tree)).toBe("\x1b[1;32mWhy?\x1b[0m");
  });

  it("keeps code blocks verbatim between fences, never wrapped", () => {
    const long = "x".repeat(120);
    const tree = root({
      type: "code",
      lang: "bash",
      value: `echo ${long}\n# done`,
    });
    expect(plainTree(tree)).toBe("```bash\necho " + long + "\n# done\n```");
  });

  it("renders bullets, ordered numbers and nested lists with indentation", () => {
    const item = (...children: Node[]): Node => ({
      type: "listItem",
      children,
    });
    const tree = root({
      type: "list",
      ordered: true,
      start: 3,
      children: [
        item(para(text("three"))),
        item(para(text("four")), {
          type: "list",
          ordered: false,
          children: [item(para(text("nested")))],
        }),
      ],
    });
    expect(plainTree(tree)).toBe("3. three\n4. four\n   - nested");
  });

  it("renders a task list checkbox", () => {
    const tree = root({
      type: "list",
      children: [
        { type: "listItem", checked: true, children: [para(text("done"))] },
      ],
    });
    expect(plainTree(tree)).toBe("- [x] done");
  });

  it("turns a callout into a labelled quote with the body on its own lines", () => {
    const tree = root({
      type: "blockquote",
      children: [
        para(
          text("[!WARNING] Only on main\nThe keyword does nothing elsewhere.")
        ),
      ],
    });
    expect(plainTree(tree)).toBe(
      "> WARNING Only on main\n>\n> The keyword does nothing elsewhere."
    );
  });

  it("keeps the inline code of a callout title and a code block in its body", () => {
    const tree = root({
      type: "blockquote",
      children: [
        para(text("[!TIP] Stop typing "), { type: "inlineCode", value: "-u" }),
        {
          type: "code",
          lang: "bash",
          value: "git config push.autoSetupRemote true",
        },
      ],
    });
    expect(plainTree(tree)).toBe(
      "> TIP Stop typing -u\n>\n> ```bash\n> git config push.autoSetupRemote true\n> ```"
    );
  });

  it("quotes an ordinary blockquote without a label", () => {
    const tree = root({ type: "blockquote", children: [para(text("quoted"))] });
    expect(plainTree(tree)).toBe("> quoted");
  });

  it("aligns table columns, header included, and honours a right-aligned column", () => {
    const cell = (value: string): Node => ({
      type: "tableCell",
      children: [text(value)],
    });
    const row = (...cells: string[]): Node => ({
      type: "tableRow",
      children: cells.map(cell),
    });
    const tree = root({
      type: "table",
      align: [null, "right"],
      children: [
        row("Strategy", "Flag"),
        row("Rebase", "--rebase"),
        row("Merge", "-m"),
      ],
    });
    expect(plainTree(tree)).toBe(
      [
        "Strategy |     Flag",
        "---------|---------",
        "Rebase   | --rebase",
        "Merge    |       -m",
      ].join("\n")
    );
  });

  it("appends the absolute target after a link and skips an anchor", () => {
    const link = (url: string, label: string): Node => ({
      type: "link",
      url,
      children: [text(label)],
    });
    expect(plainTree(root(para(link("/posts/a", "a post"))))).toBe(
      "a post (https://typovrak.tv/posts/a)"
    );
    expect(plainTree(root(para(link("#toc", "top"))))).toBe("top");
    expect(plainTree(root(para(link("https://x.y", "https://x.y"))))).toBe(
      "https://x.y"
    );
  });

  it("describes an image rather than dropping it", () => {
    const tree = root(
      para({ type: "image", url: "/img/a.avif", alt: "the shell" })
    );
    expect(plainTree(tree)).toBe(
      "[image: the shell] (https://typovrak.tv/img/a.avif)"
    );
  });

  it("keeps the text of raw html and drops the tags", () => {
    const tree = root(
      { type: "html", value: "<details>" },
      { type: "html", value: "<summary>Why these</summary>" },
      para(text("because")),
      { type: "html", value: "</details>" }
    );
    expect(plainTree(tree)).toBe("Why these\n\nbecause");
  });

  it("replaces the table of contents heading with the list of sections", () => {
    const h = (depth: number, value: string): Node => ({
      type: "heading",
      depth,
      children: [text(value)],
    });
    const tree = root(
      h(2, "Table of contents"),
      h(2, "Install"),
      h(3, "Packages"),
      h(2, "Shell")
    );
    expect(plainTree(tree)).toBe(
      "## Table of contents\n\n- Install\n  - Packages\n- Shell\n\n## Install\n\n### Packages\n\n## Shell"
    );
  });

  it("separates blocks with one blank line and leaves no gap for an empty block", () => {
    const tree = root(para(text("a")), { type: "definition" }, para(text("b")));
    expect(plainTree(tree)).toBe("a\n\nb");
  });

  it("emits no escape code at all in plain mode", () => {
    const tree = root(
      { type: "heading", depth: 2, children: [text("H")] },
      para({ type: "strong", children: [text("bold")] }, text(" "), {
        type: "inlineCode",
        value: "c",
      }),
      { type: "thematicBreak" }
    );
    expect(plainTree(tree)).not.toMatch(/\x1b/);
  });
});

describe("helpers", () => {
  it("absolutises site paths and leaves external urls alone", () => {
    expect(absoluteUrl("/posts/a", "https://typovrak.tv/")).toBe(
      "https://typovrak.tv/posts/a"
    );
    expect(absoluteUrl("https://gh.io/x", SITE)).toBe("https://gh.io/x");
    expect(absoluteUrl("#anchor", SITE)).toBe("");
  });

  it("measures text without its escape codes", () => {
    expect(visibleLength(ansi.strong("abc") + " d")).toBe(5);
  });

  it("strips tags and decodes the entities a post can carry", () => {
    expect(stripTags("<summary>A &amp; B</summary>")).toBe("A & B");
  });

  it("formats the date the way the site does, in the given timezone", () => {
    expect(
      formatDate(new Date("2026-09-01T00:00:00+02:00"), "Europe/Paris")
    ).toBe("1 Sep, 2026");
    expect(formatDate(new Date("2026-09-01T00:00:00+02:00"), "UTC")).toBe(
      "31 Aug, 2026"
    );
  });
});

describe("renderPost and renderIndex", () => {
  const post = {
    title: "A post",
    description: "What it says.",
    date: "1 Sep, 2026",
    minutes: 5,
    tags: ["CLI", "git"],
    url: `${SITE}/posts/a-post`,
    plainUrl: `${SITE}/posts/a-post.txt`,
    tree: root(para(text("Body."))),
  };

  it("opens with the title and metadata and closes with both urls", () => {
    const out = renderPost(post, { palette: plain, site: SITE });
    expect(
      out.startsWith(
        "A post\n1 Sep, 2026 · 5 min read · CLI, git\n\nWhat it says.\n"
      )
    ).toBe(true);
    expect(out).toContain("\nBody.\n");
    expect(out).toContain(`Online: ${SITE}/posts/a-post\n`);
    expect(out).toContain(`Plain text: ${SITE}/posts/a-post.txt\n`);
  });

  it("ends on the command that pages it, using the variant the reader has", () => {
    const plainOut = renderPost(post, { palette: plain, site: SITE });
    expect(plainOut.trimEnd().split("\n").pop()).toBe(
      `Read from the top: curl -s ${SITE}/posts/a-post.txt | less`
    );
    const ansiOut = renderPost(post, { palette: ansi, site: SITE });
    expect(ansiOut).toContain(`curl -s ${SITE}/posts/a-post | less -R`);
  });

  it("colours the ansi variant and ends with a newline", () => {
    const out = renderPost(post, { palette: ansi, site: SITE });
    expect(out).toMatch(/^\x1b\[1;32mA post\x1b\[0m\n/);
    expect(out.endsWith("\n")).toBe(true);
  });

  it("lists every post with its date, reading time and url", () => {
    const out = renderIndex(
      { title: "typovrak", description: "Notes.", url: SITE },
      [
        {
          title: "One",
          date: "1 Sep, 2026",
          minutes: 5,
          url: `${SITE}/posts/one`,
        },
        {
          title: "Two",
          date: "22 Jul, 2024",
          minutes: 9,
          url: `${SITE}/posts/two`,
        },
      ],
      { palette: plain }
    );
    expect(out).toContain(
      "1 Sep, 2026   One\n              5 min read https://typovrak.tv/posts/one"
    );
    expect(out).toContain(
      "22 Jul, 2024  Two\n              9 min read https://typovrak.tv/posts/two"
    );
  });
});
