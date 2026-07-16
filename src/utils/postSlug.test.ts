import { describe, expect, it } from "vitest";
import { idSlug, postPathSegments, postSlugPath } from "./postSlug";

const BLOG = "src/content/posts";

describe("idSlug", () => {
  it("takes the last segment of a collection id", () => {
    expect(idSlug("my-post")).toBe("my-post");
    expect(idSlug("2025/my-post")).toBe("my-post");
  });
});

describe("postPathSegments", () => {
  it("is empty for a post at the blog root", () => {
    expect(postPathSegments(`${BLOG}/my-post.md`, BLOG)).toEqual([]);
  });

  it("keeps directory segments as slugified URL parts", () => {
    expect(postPathSegments(`${BLOG}/2025/my-post.md`, BLOG)).toEqual(["2025"]);
    expect(postPathSegments(`${BLOG}/Arch Linux/my-post.md`, BLOG)).toEqual([
      "arch-linux",
    ]);
  });

  it("drops underscore-prefixed folders, which are organisation-only", () => {
    expect(postPathSegments(`${BLOG}/_drafts/my-post.md`, BLOG)).toEqual([]);
  });

  it("returns nothing when there is no file path", () => {
    expect(postPathSegments(undefined, BLOG)).toEqual([]);
  });
});

describe("postSlugPath", () => {
  it("is the bare slug for a root post", () => {
    expect(postSlugPath("my-post", `${BLOG}/my-post.md`, BLOG)).toBe("my-post");
  });

  it("prefixes directory segments", () => {
    expect(postSlugPath("my-post", `${BLOG}/2025/my-post.md`, BLOG)).toBe(
      "2025/my-post"
    );
  });

  it("ignores an underscore folder in the URL", () => {
    expect(postSlugPath("my-post", `${BLOG}/_drafts/my-post.md`, BLOG)).toBe(
      "my-post"
    );
  });
});
