import { describe, it, expect } from "vitest";
import { isAnswerCorrect, scoreQuiz } from "./quiz";

describe("isAnswerCorrect", () => {
  it("accepts a single correct pick", () => {
    expect(isAnswerCorrect([0], [0])).toBe(true);
  });

  it("rejects a single wrong pick", () => {
    expect(isAnswerCorrect([1], [0])).toBe(false);
  });

  it("ignores order for a multi-select answer", () => {
    expect(isAnswerCorrect([2, 0], [0, 2])).toBe(true);
  });

  it("rejects a partial multi-select answer", () => {
    expect(isAnswerCorrect([0], [0, 1])).toBe(false);
  });

  it("rejects a multi-select answer with an extra pick", () => {
    expect(isAnswerCorrect([0, 1, 2], [0, 1])).toBe(false);
  });

  it("treats no selection as wrong", () => {
    expect(isAnswerCorrect([], [0])).toBe(false);
  });
});

describe("scoreQuiz", () => {
  it("counts correct answers and the percentage", () => {
    const result = scoreQuiz([
      { selected: [0], correct: [0] },
      { selected: [1], correct: [0] },
      { selected: [0, 2], correct: [2, 0] },
      { selected: [], correct: [1] },
    ]);
    expect(result).toEqual({ correct: 2, total: 4, percent: 50 });
  });

  it("returns 0% for an empty quiz without dividing by zero", () => {
    expect(scoreQuiz([])).toEqual({ correct: 0, total: 0, percent: 0 });
  });
});
