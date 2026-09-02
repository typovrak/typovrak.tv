import { describe, it, expect } from "vitest";
import { isQuestion, questionHeadings } from "./questions";

const heading = (depth: number, text: string, slug = "s") => ({
  depth,
  slug,
  text,
});

describe("isQuestion", () => {
  it("accepts an h2 that ends with a question mark", () => {
    expect(isQuestion(heading(2, "Why yay instead of plain pacman?"))).toBe(
      true
    );
  });

  it("accepts an h3 and an h4", () => {
    expect(isQuestion(heading(3, "What goes in the shell.nix?"))).toBe(true);
    expect(isQuestion(heading(4, "Which merge strategy?"))).toBe(true);
  });

  it("rejects the h1, which is the post title", () => {
    expect(isQuestion(heading(1, "Is this a question?"))).toBe(false);
  });

  it("rejects a heading deeper than h4", () => {
    expect(isQuestion(heading(5, "Is this a question?"))).toBe(false);
  });

  it("rejects a statement heading", () => {
    expect(isQuestion(heading(2, "The zsh configuration"))).toBe(false);
  });

  it("rejects a question mark that is not the last character", () => {
    expect(isQuestion(heading(2, "Broken? Read on"))).toBe(false);
  });

  it("tolerates trailing whitespace around the question mark", () => {
    expect(isQuestion(heading(2, "Does this count?  "))).toBe(true);
  });
});

describe("questionHeadings", () => {
  it("keeps only the questions, in document order, with the text trimmed", () => {
    expect(
      questionHeadings([
        heading(2, "Setting up", "setting-up"),
        heading(2, "  Why yay?  ", "why-yay"),
        heading(1, "Title?", "title"),
        heading(3, "What next?", "what-next"),
      ])
    ).toEqual([
      { slug: "why-yay", text: "Why yay?" },
      { slug: "what-next", text: "What next?" },
    ]);
  });

  it("returns nothing for a post without a single question heading", () => {
    expect(
      questionHeadings([heading(2, "Install"), heading(3, "配置")])
    ).toEqual([]);
  });

  it("returns nothing for a post with no headings at all", () => {
    expect(questionHeadings([])).toEqual([]);
  });
});
