import { describe, expect, it } from "vitest";
import { countWords, readingTime } from "./readingTime";

describe("countWords", () => {
  it("counts plain words", () => {
    expect(countWords("one two three")).toBe(3);
  });

  it("ignores fenced code blocks", () => {
    const markdown = "before\n\n```sh\nrm -rf a b c d e f g\n```\n\nafter";
    expect(countWords(markdown)).toBe(2);
  });

  it("ignores inline code", () => {
    expect(countWords("run `pnpm build --force` now")).toBe(2);
  });

  it("keeps link text but drops the target", () => {
    expect(countWords("see [the guide](https://example.com/a/b)")).toBe(3);
  });

  it("drops images entirely", () => {
    expect(countWords("look ![a cat photo](/cat.png) here")).toBe(2);
  });

  it("does not count markdown punctuation as words", () => {
    expect(countWords("## Title\n\n- one\n- two")).toBe(3);
  });

  it("counts accented and hyphenated words once", () => {
    expect(countWords("déjà-vu élan")).toBe(2);
  });
});

describe("readingTime", () => {
  it("rounds to the nearest minute", () => {
    expect(readingTime("word ".repeat(400))).toBe(2);
  });

  it("never returns zero", () => {
    expect(readingTime("hi")).toBe(1);
    expect(readingTime("")).toBe(1);
  });
});
