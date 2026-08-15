// Strips the invisible characters that masquerade as spaces, the kind copy-paste
// and AI generation leave behind. They look fine but split words for a crawler
// and read as machine-written, which hurts SEO/GEO. Runs over the published
// prose (src/content) by default, or over the files passed as arguments.
//
//   node scripts/clean-invisibles.mjs           fixes the files in place
//   node scripts/clean-invisibles.mjs --check    reports only, exits 1 if any found
//
// Everything is defined by code point, so this file stays pure ASCII and can
// never trip its own check. Em and en dashes are flagged, never auto-replaced:
// the right fix (comma, period or parentheses) depends on the sentence. See
// CLAUDE.md.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const check = process.argv.includes("--check");
const fileArgs = process.argv.slice(2).filter(arg => arg !== "--check");

const EXTENSIONS = new Set([".md", ".mdx"]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
      // A leading underscore keeps a file out of the collection, so it is not
      // published: skip it here too, matching the content glob.
    } else if (!entry.name.startsWith("_") && EXTENSIONS.has(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

const files = fileArgs.length ? fileArgs : walk("src/content");

// A character class built from code points, so no invisible character ever
// appears in this source.
const cls = (codes, flags = "g") =>
  new RegExp(
    "[" + codes.map(c => "\\u" + c.toString(16).padStart(4, "0")).join("") + "]",
    flags
  );

// nbsp, ogham, the en/em/thin/hair space family, narrow and medium nbsp,
// ideographic space.
const SPACE = [
  0x00a0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
  0x2007, 0x2008, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000,
];
// zero-width space / non-joiner / joiner, word joiner, BOM, soft hyphen.
const ZERO_WIDTH = [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x00ad];
const LINE_SEP = [0x2028, 0x2029];
const NB_HYPHEN = [0x2011];
const DASHES = [0x2013, 0x2014];

// Always wrong in prose, so replaced without asking.
const replacements = [
  { label: "unicode space", re: cls(SPACE), to: " " },
  { label: "zero-width or soft hyphen", re: cls(ZERO_WIDTH), to: "" },
  { label: "line separator", re: cls(LINE_SEP), to: "\n" },
  { label: "non-breaking hyphen", re: cls(NB_HYPHEN), to: "-" },
];

const dashRe = cls(DASHES, "");

let fixedTotal = 0;
const dashHits = [];

for (const file of files) {
  const original = readFileSync(file, "utf8");
  let text = original;
  const counts = [];

  for (const { label, re, to } of replacements) {
    const found = text.match(re)?.length ?? 0;
    if (found > 0) {
      counts.push(`${found} ${label}`);
      fixedTotal += found;
      text = text.replace(re, to);
    }
  }

  original.split("\n").forEach((line, index) => {
    if (dashRe.test(line)) dashHits.push(`${file}:${index + 1}`);
  });

  if (text !== original) {
    const summary = counts.join(", ");
    if (check) {
      console.error(`${file}: ${summary}`);
    } else {
      writeFileSync(file, text);
      console.log(`fixed ${file}: ${summary}`);
    }
  }
}

if (dashHits.length > 0) {
  console.error("\nEm or en dashes to fix by hand (banned, see CLAUDE.md):");
  for (const hit of dashHits) console.error(`  ${hit}`);
}

if (check && (fixedTotal > 0 || dashHits.length > 0)) {
  console.error("\nRun `pnpm clean:text` to strip the invisible characters.");
  process.exit(1);
}

if (!check && fixedTotal === 0 && dashHits.length === 0) {
  console.log("Clean: no invisible characters, no em or en dashes.");
}
