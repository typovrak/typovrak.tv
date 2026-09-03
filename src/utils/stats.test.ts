import { describe, it, expect } from "vitest";
import { bucketSmall, rankQuestions, withShare } from "./stats";

describe("bucketSmall", () => {
  const rows = [
    { name: "google.com", count: 40 },
    { name: "reddit.com", count: 5 },
    { name: "news.ycombinator.com", count: 2 },
    { name: "lobste.rs", count: 1 },
  ];

  it("folds every row under the threshold into one bucket, kept last", () => {
    expect(bucketSmall(rows, 3)).toEqual([
      { name: "google.com", count: 40 },
      { name: "reddit.com", count: 5 },
      { name: "Other", count: 3 },
    ]);
  });

  it("never names a source seen fewer times than the threshold", () => {
    const names = bucketSmall(rows, 3).map(row => row.name);
    expect(names).not.toContain("news.ycombinator.com");
    expect(names).not.toContain("lobste.rs");
  });

  it("adds no bucket when nothing falls under the threshold", () => {
    const big = [
      { name: "a", count: 9 },
      { name: "b", count: 4 },
    ];
    expect(bucketSmall(big, 3)).toEqual(big);
  });

  it("keeps a row sitting exactly on the threshold", () => {
    expect(bucketSmall([{ name: "a", count: 3 }], 3)).toEqual([
      { name: "a", count: 3 },
    ]);
  });

  it("returns nothing at all for an empty input", () => {
    expect(bucketSmall([], 3)).toEqual([]);
  });
});

describe("withShare", () => {
  it("gives each row its share of the total", () => {
    expect(
      withShare([
        { name: "desktop", count: 3 },
        { name: "mobile", count: 1 },
      ])
    ).toEqual([
      { name: "desktop", count: 3, percent: 75 },
      { name: "mobile", count: 1, percent: 25 },
    ]);
  });

  it("returns 0% rather than dividing by zero", () => {
    expect(withShare([{ name: "a", count: 0 }])).toEqual([
      { name: "a", count: 0, percent: 0 },
    ]);
  });
});

describe("rankQuestions", () => {
  it("puts the most-failed question first", () => {
    const ranked = rankQuestions([
      { path: "/posts/a", question: 0, attempts: 10, wrong: 2 },
      { path: "/posts/a", question: 1, attempts: 10, wrong: 8 },
      { path: "/posts/b", question: 0, attempts: 10, wrong: 5 },
    ]);
    expect(ranked.map(row => row.wrongPercent)).toEqual([80, 50, 20]);
  });

  it("breaks a tie on the number of attempts, so the surer figure ranks first", () => {
    const ranked = rankQuestions([
      { path: "/posts/a", question: 0, attempts: 4, wrong: 2 },
      { path: "/posts/b", question: 0, attempts: 40, wrong: 20 },
    ]);
    expect(ranked[0].path).toBe("/posts/b");
  });

  it("drops a question nobody has answered instead of ranking it at 0%", () => {
    expect(
      rankQuestions([{ path: "/posts/a", question: 0, attempts: 0, wrong: 0 }])
    ).toEqual([]);
  });
});
