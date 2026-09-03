// Shapes the audience numbers before they are shown publicly. Pure (no astro
// imports) so it stays unit-testable; the API route only runs the SQL.
import { percentOf } from "./quiz";

export type Bucket = { name: string; count: number };
export type SharedBucket = Bucket & { percent: number };

// A country or a referrer seen once or twice is close to naming one visitor, so
// the tail is folded into a single bucket rather than published row by row. The
// long tail tells the reader nothing on its own either.
export const SMALL_GROUP = 3;
export const OTHER = "Other";

export function bucketSmall(
  rows: Bucket[],
  min: number = SMALL_GROUP,
  label: string = OTHER
): Bucket[] {
  const kept = rows.filter(row => row.count >= min);
  const folded = rows
    .filter(row => row.count < min)
    .reduce((total, row) => total + row.count, 0);
  return folded > 0 ? [...kept, { name: label, count: folded }] : kept;
}

export function withShare(rows: Bucket[]): SharedBucket[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return rows.map(row => ({ ...row, percent: percentOf(row.count, total) }));
}

export type QuestionStat = {
  path: string;
  question: number;
  attempts: number;
  wrong: number;
};

export type RankedQuestion = QuestionStat & { wrongPercent: number };

// Hardest first. A question nobody has answered has no rate, so it is dropped
// rather than ranked at 0%.
export function rankQuestions(rows: QuestionStat[]): RankedQuestion[] {
  return rows
    .filter(row => row.attempts > 0)
    .map(row => ({ ...row, wrongPercent: percentOf(row.wrong, row.attempts) }))
    .sort((a, b) => b.wrongPercent - a.wrongPercent || b.attempts - a.attempts);
}
