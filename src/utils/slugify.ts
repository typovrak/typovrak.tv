/**
 * Slugify a string to `[a-z0-9-]`:
 * - decompose accents to their base letter (accented -> base)
 * - lowercase
 * - anything that is not a-z or 0-9 becomes a single dash (a run never
 *   produces two dashes in a row)
 * - no leading or trailing dash
 *
 * Letters with no base form (slashed o, ligatures, non-Latin scripts) are
 * dropped, not transliterated. The site is English-only, so this is fine.
 */
export const slugifyStr = (str: string): string =>
  str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const slugifyAll = (arr: string[]) => arr.map(slugifyStr);
