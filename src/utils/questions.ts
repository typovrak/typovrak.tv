// Pure (no astro imports) so it stays unit-testable. Headings come from
// `render()`, so the text is already flattened: inline code and links arrive as
// plain text and the slug is the anchor the page actually renders.

export type PostHeading = {
  depth: number;
  slug: string;
  text: string;
};

export type Question = {
  slug: string;
  text: string;
};

// h1 is the post title, rendered by the layout rather than written in the
// markdown, and anything past h4 is too deep to stand on its own out of context.
export function isQuestion(heading: PostHeading): boolean {
  return (
    heading.depth >= 2 &&
    heading.depth <= 4 &&
    heading.text.trim().endsWith("?")
  );
}

export function questionHeadings(headings: PostHeading[]): Question[] {
  return headings
    .filter(isQuestion)
    .map(({ slug, text }) => ({ slug, text: text.trim() }));
}
