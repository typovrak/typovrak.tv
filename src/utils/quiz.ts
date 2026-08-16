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
