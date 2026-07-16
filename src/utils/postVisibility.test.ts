import { describe, expect, it } from "vitest";
import { isPostPublished } from "./postVisibility";

const MARGIN = 15 * 60 * 1000; // 15 minutes, the configured scheduled margin
const NOON = new Date("2026-06-01T12:00:00Z").getTime();

const at = (iso: string, draft = false) => ({
  draft,
  pubDatetime: new Date(iso),
});

describe("isPostPublished (production)", () => {
  const prod = { now: NOON, margin: MARGIN, isDev: false };

  it("shows a post published in the past", () => {
    expect(isPostPublished(at("2026-05-01T00:00:00Z"), prod)).toBe(true);
  });

  it("hides a post scheduled well into the future", () => {
    expect(isPostPublished(at("2026-07-01T00:00:00Z"), prod)).toBe(false);
  });

  it("hides a draft even when its date has passed", () => {
    expect(isPostPublished(at("2026-05-01T00:00:00Z", true), prod)).toBe(false);
  });

  it("reveals a scheduled post once it is within the margin", () => {
    // pubDatetime is 10 min ahead: inside the 15 min margin, so it shows.
    const soon = new Date(NOON + 10 * 60 * 1000).toISOString();
    expect(isPostPublished(at(soon), prod)).toBe(true);
  });

  it("still hides a post just outside the margin", () => {
    // 20 min ahead: past the 15 min margin, so it stays hidden.
    const later = new Date(NOON + 20 * 60 * 1000).toISOString();
    expect(isPostPublished(at(later), prod)).toBe(false);
  });
});

describe("isPostPublished (dev)", () => {
  const dev = { now: NOON, margin: MARGIN, isDev: true };

  it("shows a future non-draft, so authoring is easy", () => {
    expect(isPostPublished(at("2026-07-01T00:00:00Z"), dev)).toBe(true);
  });

  it("still hides a draft", () => {
    expect(isPostPublished(at("2026-05-01T00:00:00Z", true), dev)).toBe(false);
  });
});
