import { slugifyStr } from "./slugify";

export type Tag = { tag: string; tagName: string };

// Pure tag logic, split from getUniqueTags (which imports postFilter -> config
// -> astro:env) so it stays unit-testable. Dedups by slug, so differently-cased
// labels collapse to one tag, keeping the first label seen. Sorted by slug.
export function uniqueTags(tagNames: string[]): Tag[] {
  return tagNames
    .map(tagName => ({ tag: slugifyStr(tagName), tagName }))
    .filter(
      (value, index, self) =>
        self.findIndex(other => other.tag === value.tag) === index
    )
    .sort((a, b) => a.tag.localeCompare(b.tag));
}
