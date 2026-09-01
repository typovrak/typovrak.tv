import { describe, it, expect } from "vitest";
import {
  averagePercent,
  isAnswerCorrect,
  optionPercents,
  percentOf,
  scoreQuiz,
} from "./quiz";

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

describe("percentOf", () => {
  it("rounds to the nearest whole percent", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(2, 3)).toBe(67);
  });

  it("returns 0 rather than dividing by zero", () => {
    expect(percentOf(0, 0)).toBe(0);
    expect(percentOf(5, 0)).toBe(0);
  });
});

describe("optionPercents", () => {
  it("gives the share of answers that picked each option", () => {
    const stats = {
      answers: 10,
      correct: 6,
      picks: { "0": 2, "1": 6, "3": 2 },
    };
    expect(optionPercents(stats, 4)).toEqual([20, 60, 0, 20]);
  });

  it("counts a multi-select answer once per option, so the total can pass 100", () => {
    const stats = { answers: 4, correct: 3, picks: { "0": 4, "1": 3 } };
    expect(optionPercents(stats, 2)).toEqual([100, 75]);
  });

  it("returns a zero for every option when nobody has answered", () => {
    expect(optionPercents({ answers: 0, correct: 0, picks: {} }, 3)).toEqual([
      0, 0, 0,
    ]);
  });
});

describe("averagePercent", () => {
  it("averages over the questions answered, not over the completions", () => {
    expect(
      averagePercent({ completions: 3, sumCorrect: 5, sumTotal: 12 })
    ).toBe(42);
  });

  it("returns 0 when nobody has finished the quiz", () => {
    expect(averagePercent({ completions: 0, sumCorrect: 0, sumTotal: 0 })).toBe(
      0
    );
  });
});
