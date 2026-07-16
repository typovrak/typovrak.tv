import { describe, expect, it } from "vitest";
import type { CollectionEntry } from "astro:content";
import { getPostsByGroupCondition } from "./getPostsByGroupCondition";

// Minimal stand-ins: the grouping only reads what the group function touches.
const post = (id: string, year: number) =>
  ({
    id,
    data: { pubDatetime: new Date(`${year}-06-01`) },
  }) as CollectionEntry<"posts">;

describe("getPostsByGroupCondition", () => {
  const byYear = (p: CollectionEntry<"posts">) =>
    p.data.pubDatetime.getFullYear();

  it("groups items under their computed key", () => {
    const posts = [post("a", 2025), post("b", 2026), post("c", 2025)];
    const grouped = getPostsByGroupCondition(posts, byYear);
    expect(Object.keys(grouped).sort()).toEqual(["2025", "2026"]);
    expect(grouped[2025].map(p => p.id)).toEqual(["a", "c"]);
    expect(grouped[2026].map(p => p.id)).toEqual(["b"]);
  });

  it("preserves input order within a group", () => {
    const posts = [post("first", 2025), post("second", 2025)];
    expect(
      getPostsByGroupCondition(posts, byYear)[2025].map(p => p.id)
    ).toEqual(["first", "second"]);
  });

  it("passes the index to the group function", () => {
    const posts = [post("a", 2025), post("b", 2025), post("c", 2025)];
    const grouped = getPostsByGroupCondition(posts, (_p, i) =>
      (i ?? 0) % 2 === 0 ? "even" : "odd"
    );
    expect(grouped.even.map(p => p.id)).toEqual(["a", "c"]);
    expect(grouped.odd.map(p => p.id)).toEqual(["b"]);
  });

  it("returns an empty object for no posts", () => {
    expect(getPostsByGroupCondition([], byYear)).toEqual({});
  });
});
