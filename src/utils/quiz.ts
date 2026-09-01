// pure (no astro imports) so it stays unit-testable and reusable client-side
export type QuizQuestion = {
  q: string;
  multiple?: boolean;
  options: string[];
  correct: number[];
  explain?: string;
};

// exact set match, order-independent; a partial multi-answer counts as wrong
export function isAnswerCorrect(
  selected: number[],
  correct: number[]
): boolean {
  if (selected.length !== correct.length) return false;
  const wanted = new Set(correct);
  return selected.every(index => wanted.has(index));
}

export function scoreQuiz(
  graded: { selected: number[]; correct: number[] }[]
): { correct: number; total: number; percent: number } {
  const total = graded.length;
  const correct = graded.filter(g =>
    isAnswerCorrect(g.selected, g.correct)
  ).length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percent };
}

export type QuizAnswerStats = {
  answers: number;
  correct: number;
  // keyed by option index as a string, since it comes back from JSON
  picks: Record<string, number>;
};

export type QuizResultStats = {
  completions: number;
  sumCorrect: number;
  sumTotal: number;
};

export function percentOf(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

// a multi-select answer counts once per option it picked, so these can sum past 100
export function optionPercents(
  stats: QuizAnswerStats,
  optionCount: number
): number[] {
  return Array.from({ length: optionCount }, (_, index) =>
    percentOf(stats.picks[String(index)] ?? 0, stats.answers)
  );
}

export function averagePercent(stats: QuizResultStats): number {
  return percentOf(stats.sumCorrect, stats.sumTotal);
}
