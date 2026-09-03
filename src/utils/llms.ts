// Renders the two llms.txt files, the convention from llmstxt.org: a markdown
// index of the site at /llms.txt, and the full text of every post at
// /llms-full.txt. Pure (no astro imports) so it stays unit-testable.
//
// The body of each post arrives already rendered by terminal.ts with the plain
// palette, which emits valid markdown: `## heading`, fenced code blocks, `- `
// lists, `> ` quotes and gfm tables without their optional outer pipes.

export type LlmsSite = {
  title: string;
  description: string;
};

export type LlmsEntry = {
  title: string;
  url: string;
  description: string;
};

export type LlmsSection = {
  name: string;
  entries: LlmsEntry[];
};

// A document in llms-full.txt: a post, or a page of the site rendered from the
// same data the page itself uses. Only a post carries a date and tags.
export type LlmsDocument = LlmsEntry & {
  date?: string;
  tags?: string[];
  body: string;
};

export type LlmsGroup = {
  name: string;
  items: { name: string; note: string }[];
};

// A description written over several lines in frontmatter would break the list
// item it sits in, so everything on one line.
const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

function preamble(site: LlmsSite, notes: string[]): string[] {
  const lines = [
    `# ${oneLine(site.title)}`,
    "",
    `> ${oneLine(site.description)}`,
  ];
  for (const note of notes) lines.push("", oneLine(note));
  return lines;
}

export function renderLlmsIndex(
  site: LlmsSite,
  sections: LlmsSection[],
  notes: string[] = []
): string {
  const lines = preamble(site, notes);
  for (const section of sections) {
    if (section.entries.length === 0) continue;
    lines.push("", `## ${section.name}`, "");
    for (const entry of section.entries) {
      const description = oneLine(entry.description);
      lines.push(
        `- [${oneLine(entry.title)}](${entry.url})${description ? `: ${description}` : ""}`
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

// Renders a list of named groups as markdown, the shape the NixOS module list
// takes: one heading per category, one item per module.
export function renderGroups(groups: LlmsGroup[]): string {
  const lines: string[] = [];
  for (const group of groups) {
    if (group.items.length === 0) continue;
    if (lines.length > 0) lines.push("");
    lines.push(`## ${oneLine(group.name)}`, "");
    for (const item of group.items) {
      const note = oneLine(item.note);
      lines.push(`- \`${item.name}\`${note ? `: ${note}` : ""}`);
    }
  }
  return lines.join("\n");
}

export function renderLlmsFull(
  site: LlmsSite,
  posts: LlmsDocument[],
  notes: string[] = []
): string {
  const documents = posts.map(post => {
    const meta = [`Source: ${post.url}`];
    if (post.date) meta.push(`Published: ${post.date}`);
    if (post.tags && post.tags.length > 0) {
      meta.push(`Tags: ${post.tags.join(", ")}`);
    }
    const description = oneLine(post.description);
    return [
      `# ${oneLine(post.title)}`,
      "",
      ...meta,
      ...(description ? ["", description] : []),
      "",
      post.body,
    ].join("\n");
  });
  return `${[preamble(site, notes).join("\n"), ...documents].join("\n\n---\n\n")}\n`;
}
