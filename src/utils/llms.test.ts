import { describe, it, expect } from "vitest";
import { renderGroups, renderLlmsFull, renderLlmsIndex } from "./llms";

const SITE = { title: "typovrak", description: "Notes on Linux." };

describe("renderLlmsIndex", () => {
  it("opens with the title, the blockquote summary and the notes", () => {
    const out = renderLlmsIndex(SITE, [], ["Every post is also plain text."]);
    expect(out).toBe(
      "# typovrak\n\n> Notes on Linux.\n\nEvery post is also plain text.\n"
    );
  });

  it("lists each entry as a markdown link followed by its description", () => {
    const out = renderLlmsIndex(SITE, [
      {
        name: "Posts",
        entries: [
          {
            title: "A post",
            url: "https://typovrak.tv/posts/a",
            description: "What it says.",
          },
        ],
      },
    ]);
    expect(out).toContain(
      "## Posts\n\n- [A post](https://typovrak.tv/posts/a): What it says."
    );
  });

  it("collapses a description written over several lines onto one", () => {
    const out = renderLlmsIndex(SITE, [
      {
        name: "Posts",
        entries: [
          { title: "A", url: "u", description: "first line\n  second line" },
        ],
      },
    ]);
    expect(out).toContain("- [A](u): first line second line\n");
  });

  it("omits the colon when an entry has no description", () => {
    const out = renderLlmsIndex(SITE, [
      { name: "Pages", entries: [{ title: "A", url: "u", description: "" }] },
    ]);
    expect(out).toContain("- [A](u)\n");
    expect(out).not.toContain("- [A](u):");
  });

  it("skips a section with no entries rather than leaving an empty heading", () => {
    const out = renderLlmsIndex(SITE, [
      { name: "Posts", entries: [] },
      { name: "Pages", entries: [{ title: "A", url: "u", description: "d" }] },
    ]);
    expect(out).not.toContain("## Posts");
    expect(out).toContain("## Pages");
  });

  it("ends with exactly one newline", () => {
    const out = renderLlmsIndex(SITE, [
      { name: "Posts", entries: [{ title: "A", url: "u", description: "d" }] },
    ]);
    expect(out.endsWith("d\n")).toBe(true);
  });
});

describe("renderLlmsFull", () => {
  const post = {
    title: "A post",
    url: "https://typovrak.tv/posts/a",
    description: "What it says.",
    date: "1 Sep, 2026",
    tags: ["CLI", "git"],
    body: "## Why?\n\nBecause.",
  };

  it("gives each post a heading, its source, its date and its tags", () => {
    const out = renderLlmsFull(SITE, [post]);
    expect(out).toContain(
      "# A post\n\nSource: https://typovrak.tv/posts/a\nPublished: 1 Sep, 2026\nTags: CLI, git\n\nWhat it says.\n\n## Why?\n\nBecause."
    );
  });

  it("separates the preamble and each post with a horizontal rule", () => {
    const out = renderLlmsFull(SITE, [post, { ...post, title: "Second" }]);
    expect(out.split("\n---\n")).toHaveLength(3);
  });

  it("leaves out the tag line for a post with no tag", () => {
    const out = renderLlmsFull(SITE, [{ ...post, tags: [] }]);
    expect(out).not.toContain("Tags:");
    expect(out).toContain("Published: 1 Sep, 2026\n\nWhat it says.");
  });

  it("still renders the preamble when there is no post at all", () => {
    expect(renderLlmsFull(SITE, [])).toBe("# typovrak\n\n> Notes on Linux.\n");
  });
});

describe("renderLlmsFull with a page rather than a post", () => {
  const page = {
    title: "NixOS config",
    url: "https://typovrak.tv/nixos",
    description: "One module per tool.",
    body: "## Shell\n\n- `zsh`: the shell",
  };

  it("leaves out the date and tag lines a page does not have", () => {
    const out = renderLlmsFull({ title: "t", description: "d" }, [page]);
    expect(out).toContain(
      "# NixOS config\n\nSource: https://typovrak.tv/nixos\n\nOne module per tool.\n\n## Shell"
    );
    expect(out).not.toContain("Published:");
    expect(out).not.toContain("Tags:");
  });
});

describe("renderGroups", () => {
  it("renders a heading per group and a code-quoted name per item", () => {
    expect(
      renderGroups([
        {
          name: "Shell",
          items: [
            { name: "zsh", note: "zsh with plugins" },
            { name: "starship", note: "the prompt" },
          ],
        },
      ])
    ).toBe("## Shell\n\n- `zsh`: zsh with plugins\n- `starship`: the prompt");
  });

  it("separates groups with a blank line and skips an empty one", () => {
    expect(
      renderGroups([
        { name: "Empty", items: [] },
        { name: "A", items: [{ name: "x", note: "n" }] },
        { name: "B", items: [{ name: "y", note: "" }] },
      ])
    ).toBe("## A\n\n- `x`: n\n\n## B\n\n- `y`");
  });

  it("returns nothing when every group is empty", () => {
    expect(renderGroups([{ name: "A", items: [] }])).toBe("");
  });
});
