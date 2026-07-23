// Reading time from the raw markdown body. Kept free of astro:* imports so it
// stays unit-testable; callers pass post.body.

// Average adult prose speed. Code-heavy posts read slower, but a single honest
// number beats a per-language guess.
const WORDS_PER_MINUTE = 200;

export function countWords(markdown: string): number {
  const text = markdown
    // Fenced code blocks are skimmed, not read word by word.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    // Keep link text, drop the target.
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Markdown punctuation needs no stripping: a word has to start with a letter
  // or a digit, so #, -, > and friends never match on their own. Stripping them
  // would split hyphenated words in two.

  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return words ? words.length : 0;
}

export function readingTime(markdown: string): number {
  const minutes = Math.round(countWords(markdown) / WORDS_PER_MINUTE);
  // A one-line post still takes a moment; never advertise 0 min.
  return Math.max(1, minutes);
}
