// Pulls short, typable excerpts from the Star Rune landing page source into the
// JSON the typing trainer reads at build. Run daily by a GitHub Action; no
// runtime API call, no third-party dependency (native fetch).

import { writeFileSync } from "node:fs";

const token = process.env.GH_TOKEN;
const repo = process.env.TYPING_REPO ?? "typovrak/star-rune-landing-page";
if (!token) {
  console.error("GH_TOKEN is required.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "typovrak.tv-build",
};

// Icons and stories are mostly SVG path data and generated prose: unreadable and
// miserable to type.
const SKIP = /^(icons|stories|public|node_modules)\//;
const SOURCE = /\.(ts|tsx|css)$/;

const MAX_LINE = 78;
const MIN_LINES = 5;
const MAX_LINES = 9;
const MAX_SNIPPETS = 24;
const MAX_FILES = 14;

const api = async path => {
  const response = await fetch(`https://api.github.com/${path}`, { headers });
  if (!response.ok) {
    console.error("GitHub API error:", response.status, await response.text());
    process.exit(1);
  }
  return response.json();
};

const dedent = lines => {
  const indent = Math.min(...lines.map(line => line.match(/^ */)[0].length));
  return lines.map(line => line.slice(indent));
};

// Keeps runs of consecutive lines that are short, non-empty and plain ASCII, so
// no line wraps and no dead key is ever required.
function extractSnippets(source) {
  const lines = source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.replace(/\t/g, "  ").replace(/\s+$/, ""));

  const snippets = [];
  let run = [];

  const flush = () => {
    if (run.length >= MIN_LINES) {
      snippets.push(dedent(run.slice(0, MAX_LINES)).join("\n"));
    }
    run = [];
  };

  for (const line of lines) {
    const usable =
      line.length > 0 &&
      line.length <= MAX_LINE &&
      /^[\x20-\x7E]*$/.test(line);
    if (!usable) {
      flush();
      continue;
    }
    run.push(line);
    if (run.length === MAX_LINES) flush();
  }
  flush();

  return snippets;
}

const { default_branch: branch } = await api(`repos/${repo}`);
const { tree } = await api(
  `repos/${repo}/git/trees/${branch}?recursive=1`
);

const files = tree
  .filter(
    entry =>
      entry.type === "blob" &&
      SOURCE.test(entry.path) &&
      !SKIP.test(entry.path) &&
      entry.size > 400 &&
      entry.size < 20000
  )
  .sort((a, b) => a.path.localeCompare(b.path))
  .slice(0, MAX_FILES);

const snippets = [];
for (const file of files) {
  const response = await fetch(
    `https://raw.githubusercontent.com/${repo}/${branch}/${file.path}`,
    { headers: { "User-Agent": headers["User-Agent"] } }
  );
  if (!response.ok) continue;
  const source = await response.text();
  // Import blocks are the first run in almost every file and dull to type, so
  // prefer real logic and fall back only if a file has nothing else.
  const blocks = extractSnippets(source);
  const isImports = block => {
    const lines = block.split("\n");
    const imports = lines.filter(line => /^(import|export) /.test(line));
    return imports.length / lines.length > 0.6;
  };
  const best = blocks.find(block => !isImports(block)) ?? blocks[0];
  if (best) snippets.push({ path: file.path, code: best });
  if (snippets.length >= MAX_SNIPPETS) break;
}

if (snippets.length === 0) {
  console.error("No usable snippet found; leaving the file untouched.");
  process.exit(1);
}

// Indented so the daily commit produces a readable line-by-line diff. This file
// is excluded from prettier (see .prettierignore).
writeFileSync(
  "src/data/typing-snippets.json",
  JSON.stringify(
    { repo, branch, url: `https://github.com/${repo}`, snippets },
    null,
    2
  ) + "\n"
);
console.log(`typing-snippets: ${snippets.length} snippets from ${repo}.`);
