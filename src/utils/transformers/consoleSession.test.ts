import { describe, it, expect } from "vitest";
import { transformerConsoleSession } from "./consoleSession";

type Token = {
  type: string;
  properties: Record<string, string>;
  children: { value: string }[];
};

const PLAIN = "color:#CDD6F4";
const ACCENT = "color:var(--accent)";
const WARNING = "color:var(--warning)";
const DANGER = "color:var(--danger)";

const token = (value: string): Token => ({
  type: "element",
  properties: { style: PLAIN },
  children: [{ value }],
});

const runLine = (lang: string, values: string[]) => {
  const node = { children: values.map(token) };
  const transformer = transformerConsoleSession() as {
    line: (this: { options: { lang: string } }, node: unknown) => void;
  };
  transformer.line.call({ options: { lang } }, node);
  return node.children.map(child => child.properties.style);
};

const styleOf = (lang: string, line: string) => runLine(lang, [line])[0];

describe("transformerConsoleSession", () => {
  it("paints every token after the prompt with the accent and leaves the $ alone", () => {
    expect(runLine("console", ["$", " ls", " -la"])).toEqual([
      PLAIN,
      ACCENT,
      ACCENT,
    ]);
  });

  it("ignores a leading $ in another language, where it is not a prompt", () => {
    expect(runLine("bash", ["$", " ls"])).toEqual([PLAIN, PLAIN]);
  });

  it("does not treat a $ inside a word as a prompt", () => {
    expect(runLine("console", ["$HOME", "/bin"])).toEqual([PLAIN, PLAIN]);
  });

  it("colours the severity shapes real tools print", () => {
    expect(styleOf("console", "Error: Failed to fetch - 404")).toBe(DANGER);
    expect(styleOf("console", "fatal: not a git repository")).toBe(DANGER);
    expect(styleOf("console", "Warning Precompiled engines missing")).toBe(
      WARNING
    );
    expect(styleOf("console", "[WARN] The pnpm field is ignored")).toBe(
      WARNING
    );
    expect(styleOf("console", "prisma:warn Prisma failed to detect")).toBe(
      WARNING
    );
  });

  it("leaves ordinary output alone, severity word or not", () => {
    expect(styleOf("console", "Please manually install OpenSSL")).toBe(PLAIN);
    expect(styleOf("console", "prisma                  : 6.19.3")).toBe(PLAIN);
    // the word is there but not at the front, so it is prose
    expect(styleOf("console", "no error was reported")).toBe(PLAIN);
  });

  it("colours a severity line across every token it was split into", () => {
    expect(runLine("console", ["Error", ": 404", " Not Found"])).toEqual([
      DANGER,
      DANGER,
      DANGER,
    ]);
  });

  it("never repaints a command line as a warning", () => {
    expect(runLine("console", ["$", " warn-me --now"])).toEqual([
      PLAIN,
      ACCENT,
    ]);
  });
});
