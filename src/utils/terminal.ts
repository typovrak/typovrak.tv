// Renders a post's markdown tree as text for a terminal, with ANSI colour or as
// plain text. Pure (no astro imports) so it stays unit-testable; the endpoints
// under src/pages hand it the tree, the metadata and a palette.

// The mdast shape this renderer reads. Declared here rather than pulled from
// @types/mdast, which is not a dependency; unknown node types fall through to
// their children.
export type Node = {
  type: string;
  children?: Node[];
  value?: string;
  depth?: number;
  lang?: string | null;
  url?: string;
  alt?: string | null;
  ordered?: boolean | null;
  start?: number | null;
  checked?: boolean | null;
  spread?: boolean | null;
  align?: (string | null)[] | null;
};

export type Palette = {
  title: (text: string) => string;
  heading: (level: number, text: string) => string;
  strong: (text: string) => string;
  em: (text: string) => string;
  code: (text: string) => string;
  link: (text: string) => string;
  dim: (text: string) => string;
  accent: (text: string) => string;
  warn: (text: string) => string;
  codeOpen: (lang: string) => string;
  codeClose: () => string;
  rule: (width: number) => string;
  // the command that pages this variant from the top, printed last since the
  // terminal lands on the end of the output
  pager: (url: string, plainUrl: string) => string;
  bullet: string;
  bar: string;
};

const identity = (text: string) => text;

const sgr = (codes: string) => (text: string) =>
  text === "" ? "" : `\x1b[${codes}m${text}\x1b[0m`;

// Standard 16-colour codes, so the terminal's own theme decides the exact
// shade and a light background stays readable.
export const ansi: Palette = {
  title: sgr("1;32"),
  heading: (level, text) => (level <= 2 ? sgr("1;32")(text) : sgr("1")(text)),
  strong: sgr("1"),
  em: sgr("3"),
  code: sgr("36"),
  link: sgr("4;32"),
  dim: sgr("2"),
  accent: sgr("32"),
  warn: sgr("33"),
  codeOpen: lang =>
    sgr("2")(`─── ${lang} ${"─".repeat(Math.max(0, 40 - lang.length))}`),
  codeClose: () => sgr("2")("─".repeat(45)),
  rule: width => sgr("2")("─".repeat(width)),
  pager: url => `curl -s ${url} | less -R`,
  bullet: "•",
  bar: "│",
};

// Safe to redirect into a file: no escape codes, and the block markers stay
// close to the markdown they came from.
export const plain: Palette = {
  title: identity,
  heading: (level, text) => `${"#".repeat(level)} ${text}`,
  strong: identity,
  em: identity,
  code: identity,
  link: identity,
  dim: identity,
  accent: identity,
  warn: identity,
  codeOpen: lang => "```" + lang,
  codeClose: () => "```",
  rule: width => "-".repeat(width),
  pager: (_url, plainUrl) => `curl -s ${plainUrl} | less`,
  bullet: "-",
  bar: ">",
};

export const WIDTH = 80;

type Style = "text" | "strong" | "em" | "code" | "link" | "dim";
type Segment = { text: string; style: Style };

type Context = {
  palette: Palette;
  site: string;
  width: number;
  root: Node;
};

const childrenOf = (node: Node): Node[] => node.children ?? [];

export function absoluteUrl(url: string, site: string): string {
  if (url.startsWith("#")) return "";
  if (url.startsWith("/")) return site.replace(/\/$/, "") + url;
  return url;
}

// Only what an html node may carry in a post: <details>, <summary> and the odd
// inline tag. The text between the tags is kept, the tags are not.
export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export function textOf(node: Node): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }
  if (node.type === "html") return stripTags(node.value ?? "");
  return childrenOf(node).map(textOf).join("");
}

function inline(node: Node, ctx: Context, style: Style = "text"): Segment[] {
  switch (node.type) {
    case "text":
      return [{ text: node.value ?? "", style }];
    case "inlineCode":
      return [{ text: node.value ?? "", style: "code" }];
    case "strong":
      return childrenOf(node).flatMap(child => inline(child, ctx, "strong"));
    case "emphasis":
      return childrenOf(node).flatMap(child => inline(child, ctx, "em"));
    case "delete":
      return childrenOf(node).flatMap(child => inline(child, ctx, "dim"));
    case "break":
      return [{ text: "\n", style }];
    case "html":
      return [{ text: stripTags(node.value ?? ""), style }];
    case "link": {
      const label = childrenOf(node).flatMap(child =>
        inline(child, ctx, "link")
      );
      const target = absoluteUrl(node.url ?? "", ctx.site);
      const labelText = label.map(segment => segment.text).join("");
      if (!target || labelText === target) return label;
      return [...label, { text: ` (${target})`, style: "dim" }];
    }
    case "image": {
      const target = absoluteUrl(node.url ?? "", ctx.site);
      const alt = node.alt ? `[image: ${node.alt}]` : "[image]";
      return [{ text: target ? `${alt} (${target})` : alt, style: "dim" }];
    }
    default:
      return childrenOf(node).flatMap(child => inline(child, ctx, style));
  }
}

export function visibleLength(text: string): number {
  return text.replace(/\x1b\[[0-9;]*m/g, "").length;
}

// Greedy word wrap that keeps each word's style. Whitespace collapses to one
// space, a "\n" segment forces a break, and a word longer than the width gets
// a line of its own rather than being cut.
export function wrap(segments: Segment[], width: number): Segment[][] {
  const lines: Segment[][] = [];
  let line: Segment[] = [];
  let used = 0;

  const flush = () => {
    const last = line[line.length - 1];
    if (last && last.text.endsWith(" ")) last.text = last.text.trimEnd();
    lines.push(line);
    line = [];
    used = 0;
  };

  for (const segment of segments) {
    for (const token of segment.text.split(/(\s+)/)) {
      if (token === "") continue;
      if (token.includes("\n")) {
        flush();
        continue;
      }
      if (/^\s+$/.test(token)) {
        if (used > 0 && !line[line.length - 1]?.text.endsWith(" ")) {
          line.push({ text: " ", style: segment.style });
          used += 1;
        }
        continue;
      }
      if (used > 0 && used + token.length > width) flush();
      line.push({ text: token, style: segment.style });
      used += token.length;
    }
  }
  if (line.length > 0 || lines.length === 0) flush();
  return lines;
}

function paint(segments: Segment[], palette: Palette): string {
  const merged: Segment[] = [];
  for (const segment of segments) {
    const last = merged[merged.length - 1];
    if (last && last.style === segment.style) last.text += segment.text;
    else merged.push({ ...segment });
  }
  const styles: Record<Style, (text: string) => string> = {
    text: identity,
    strong: palette.strong,
    em: palette.em,
    code: palette.code,
    link: palette.link,
    dim: palette.dim,
  };
  return merged.map(segment => styles[segment.style](segment.text)).join("");
}

function paragraph(node: Node, ctx: Context): string[] {
  return wrap(inline(node, ctx), ctx.width).map(line =>
    paint(line, ctx.palette)
  );
}

const TOC_TITLE = "table of contents";

function toc(ctx: Context): string[] {
  const entries: string[] = [];
  const walk = (node: Node) => {
    if (node.type === "heading" && node.depth && node.depth <= 3) {
      const text = textOf(node);
      if (text.toLowerCase() !== TOC_TITLE) {
        const indent = "  ".repeat(node.depth - 2);
        entries.push(`${indent}${ctx.palette.bullet} ${text}`);
      }
    }
    childrenOf(node).forEach(walk);
  };
  walk(ctx.root);
  return entries;
}

function heading(node: Node, ctx: Context): string[] {
  const text = textOf(node);
  const level = node.depth ?? 2;
  if (text.toLowerCase() === TOC_TITLE) {
    const entries = toc(ctx);
    return entries.length
      ? [ctx.palette.heading(level, text), "", ...entries]
      : [];
  }
  return [ctx.palette.heading(level, text)];
}

function codeBlock(node: Node, ctx: Context): string[] {
  const lang = node.lang ?? "";
  return [
    ctx.palette.codeOpen(lang),
    ...(node.value ?? "").split("\n"),
    ctx.palette.codeClose(),
  ];
}

// A callout is a blockquote whose first paragraph opens with [!KIND], the
// syntax rehype-callouts renders on the site. The title runs to the end of
// that line; anything after the line break is the body.
const CALLOUT = /^\[!(\w+)\]\s*/;

function splitCallout(
  quote: Node
): { kind: string; title: Node[]; body: Node[] } | null {
  const [first, ...rest] = childrenOf(quote);
  if (!first || first.type !== "paragraph") return null;
  const [lead, ...others] = childrenOf(first);
  if (!lead || lead.type !== "text" || !CALLOUT.test(lead.value ?? "")) {
    return null;
  }
  const kind = CALLOUT.exec(lead.value ?? "")?.[1] ?? "note";
  const inlineNodes = [
    { ...lead, value: (lead.value ?? "").replace(CALLOUT, "") },
    ...others,
  ];
  const title: Node[] = [];
  const tail: Node[] = [];
  let split = false;
  for (const child of inlineNodes) {
    if (split) {
      tail.push(child);
      continue;
    }
    const value = child.value ?? "";
    const index = child.type === "text" ? value.indexOf("\n") : -1;
    if (index === -1) {
      title.push(child);
      continue;
    }
    title.push({ ...child, value: value.slice(0, index) });
    const after = value.slice(index + 1);
    if (after) tail.push({ ...child, value: after });
    split = true;
  }
  const body = tail.length
    ? [{ type: "paragraph", children: tail }, ...rest]
    : rest;
  return { kind, title, body };
}

function blockquote(node: Node, ctx: Context): string[] {
  const { palette } = ctx;
  const inner = { ...ctx, width: ctx.width - 2 };
  const prefix = (line: string) =>
    line ? `${palette.bar} ${line}` : palette.bar;
  const callout = splitCallout(node);
  if (!callout) return blocks(childrenOf(node), inner).map(prefix);

  const tone = /^(warning|caution|danger|bug)$/i.test(callout.kind)
    ? palette.warn
    : palette.accent;
  const titleText = paint(
    callout.title.flatMap(child => inline(child, inner)),
    palette
  );
  const head =
    tone(`${callout.kind.toUpperCase()}`) +
    (titleText ? ` ${palette.strong(titleText)}` : "");
  const body = blocks(callout.body, inner);
  return [head, ...(body.length ? ["", ...body] : [])].map(prefix);
}

function listItem(
  item: Node,
  index: number,
  list: Node,
  ctx: Context
): string[] {
  const { palette } = ctx;
  const marker = list.ordered
    ? `${(list.start ?? 1) + index}.`
    : palette.bullet;
  const box =
    item.checked === true ? "[x] " : item.checked === false ? "[ ] " : "";
  const pad = " ".repeat(marker.length + 1);
  // a tight item (no blank line in the source) keeps its nested list close
  const inner = blocks(
    childrenOf(item),
    { ...ctx, width: ctx.width - pad.length },
    { tight: !item.spread }
  );
  if (inner.length === 0) return [`${marker} ${box}`.trimEnd()];
  return inner.map((line, at) =>
    at === 0 ? `${marker} ${box}${line}` : line ? `${pad}${line}` : ""
  );
}

function list(node: Node, ctx: Context): string[] {
  return childrenOf(node).flatMap((item, index) =>
    listItem(item, index, node, ctx)
  );
}

function table(node: Node, ctx: Context): string[] {
  const { palette } = ctx;
  const rows = childrenOf(node).map(row =>
    childrenOf(row).map(cell => paint(inline(cell, ctx), palette))
  );
  const columns = Math.max(0, ...rows.map(row => row.length));
  const widths = Array.from({ length: columns }, (_, column) =>
    Math.max(0, ...rows.map(row => visibleLength(row[column] ?? "")))
  );
  const align = node.align ?? [];
  const pad = (text: string, column: number) => {
    const fill = " ".repeat(widths[column] - visibleLength(text));
    return align[column] === "right" ? fill + text : text + fill;
  };
  const line = (row: string[]) =>
    row
      .map((cell, column) => pad(cell, column))
      .join(" | ")
      .trimEnd();
  const [header, ...body] = rows;
  if (!header) return [];
  const separator = widths.map(width => "-".repeat(width)).join("-|-");
  return [line(header), palette.dim(separator), ...body.map(line)];
}

function block(node: Node, ctx: Context): string[] {
  switch (node.type) {
    case "paragraph":
      return paragraph(node, ctx);
    case "heading":
      return heading(node, ctx);
    case "code":
      return codeBlock(node, ctx);
    case "blockquote":
      return blockquote(node, ctx);
    case "list":
      return list(node, ctx);
    case "table":
      return table(node, ctx);
    case "thematicBreak":
      return [ctx.palette.rule(Math.min(ctx.width, 40))];
    case "html": {
      const text = stripTags(node.value ?? "");
      return text
        ? wrap([{ text, style: "text" }], ctx.width).map(line =>
            paint(line, ctx.palette)
          )
        : [];
    }
    case "definition":
    case "footnoteDefinition":
    case "yaml":
    case "toml":
      return [];
    default:
      return blocks(childrenOf(node), ctx);
  }
}

// Blocks are separated by one blank line; a block that renders to nothing
// leaves no gap behind.
export function blocks(
  nodes: Node[],
  ctx: Context,
  options: { tight?: boolean } = {}
): string[] {
  const out: string[] = [];
  for (const node of nodes) {
    const lines = block(node, ctx);
    if (lines.length === 0) continue;
    if (out.length > 0 && !options.tight) out.push("");
    out.push(...lines);
  }
  return out;
}

export function renderTree(
  tree: Node,
  options: { palette: Palette; site: string; width?: number }
): string {
  const ctx: Context = {
    palette: options.palette,
    site: options.site,
    width: options.width ?? WIDTH,
    root: tree,
  };
  return blocks(childrenOf(tree), ctx).join("\n");
}

// Same shape as Datetime.astro: the timezone shapes the calendar date, the
// instant stays what it is.
export function formatDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(item => item.type === type)?.value ?? "";
  return `${part("day")} ${part("month")}, ${part("year")}`;
}

export type TerminalPost = {
  title: string;
  description: string;
  date: string;
  minutes: number;
  tags: string[];
  url: string;
  plainUrl: string;
  tree: Node;
};

const wrapText = (text: string, palette: Palette, width = WIDTH) =>
  wrap([{ text, style: "text" }], width).map(line => paint(line, palette));

export function renderPost(
  post: TerminalPost,
  options: { palette: Palette; site: string; width?: number }
): string {
  const { palette } = options;
  const width = options.width ?? WIDTH;
  const meta = [post.date, `${post.minutes} min read`, post.tags.join(", ")]
    .filter(Boolean)
    .join(" · ");
  const lines = [
    palette.title(post.title),
    palette.dim(meta),
    "",
    ...wrapText(post.description, palette, width),
    "",
    palette.rule(width),
    "",
    renderTree(post.tree, options),
    "",
    palette.rule(width),
    `${palette.dim("Online:")} ${palette.link(post.url)}`,
    `${palette.dim("Plain text:")} ${palette.link(post.plainUrl)}`,
    `${palette.dim("Read from the top:")} ${palette.code(palette.pager(post.url, post.plainUrl))}`,
    "",
  ];
  return lines.join("\n");
}

export type TerminalIndexEntry = {
  title: string;
  date: string;
  minutes: number;
  url: string;
};

export function renderIndex(
  site: { title: string; description: string; url: string },
  posts: TerminalIndexEntry[],
  options: { palette: Palette; width?: number }
): string {
  const { palette } = options;
  const width = options.width ?? WIDTH;
  const dateWidth = Math.max(0, ...posts.map(post => post.date.length));
  const lines = [
    palette.title(site.title),
    ...wrapText(site.description, palette, width),
    "",
    palette.heading(2, "Posts"),
    "",
    ...posts.flatMap(post => [
      `${palette.dim(post.date.padEnd(dateWidth))}  ${palette.strong(post.title)}`,
      `${" ".repeat(dateWidth)}  ${palette.dim(`${post.minutes} min read`)} ${palette.link(post.url)}`,
      "",
    ]),
    palette.rule(width),
    `${palette.dim("Online:")} ${palette.link(site.url)}`,
    `${palette.dim("Read from the top:")} ${palette.code(palette.pager(site.url, `${site.url}/index.txt`))}`,
    "",
  ];
  return lines.join("\n");
}
