import { describe, expect, it } from "vitest";
import {
  fileToPath,
  normalisePath,
  paginatedPaths,
  searchResultKind,
  stripResultSlash,
} from "./paths";

describe("normalisePath", () => {
  it("keeps a plain path", () => {
    expect(normalisePath("/about")).toBe("/about");
  });

  it("maps the root to /", () => {
    expect(normalisePath("/")).toBe("/");
  });

  it("strips trailing slashes so /about and /about/ are one row", () => {
    expect(normalisePath("/about/")).toBe("/about");
    expect(normalisePath("/about///")).toBe("/about");
  });

  it("drops the query string and hash, which can carry personal data", () => {
    expect(normalisePath("/about?utm=x&q=secret")).toBe("/about");
    expect(normalisePath("/about#anchor")).toBe("/about");
  });

  it("resolves traversal rather than trusting the input", () => {
    expect(normalisePath("/posts/../admin")).toBe("/admin");
  });

  it("rejects anything that is not an absolute path", () => {
    expect(normalisePath("about")).toBeNull();
    expect(normalisePath("https://evil.test/x")).toBeNull();
    expect(normalisePath("//evil.test/x")).toBe("/x");
  });

  it("rejects an over-long path", () => {
    expect(normalisePath(`/${"a".repeat(255)}`)).toBeNull();
  });
});

describe("fileToPath", () => {
  it("maps index to its directory", () => {
    expect(fileToPath("/src/pages/index.astro")).toBe("/");
    expect(fileToPath("/src/pages/tags/index.astro")).toBe("/tags");
  });

  it("maps a plain page", () => {
    expect(fileToPath("/src/pages/about.astro")).toBe("/about");
  });

  it("skips dynamic routes, whose paths come from the collection", () => {
    expect(fileToPath("/src/pages/posts/[...page].astro")).toBeNull();
    expect(fileToPath("/src/pages/tags/[tag]/[...page].astro")).toBeNull();
  });

  it("skips underscore-prefixed files and folders, which Astro does not route", () => {
    expect(fileToPath("/src/pages/posts/_components/Foo.astro")).toBeNull();
    expect(fileToPath("/src/pages/_draft.astro")).toBeNull();
  });
});

describe("paginatedPaths", () => {
  it("gives page 1 no suffix, matching Astro paginate()", () => {
    expect(paginatedPaths("/posts", 4, 4)).toEqual(["/posts"]);
  });

  it("numbers later pages from 2", () => {
    expect(paginatedPaths("/posts", 9, 4)).toEqual([
      "/posts",
      "/posts/2",
      "/posts/3",
    ]);
  });

  it("still yields the base page when there is nothing to paginate", () => {
    expect(paginatedPaths("/posts", 0, 4)).toEqual(["/posts"]);
  });

  it("does not emit an extra page on an exact multiple", () => {
    expect(paginatedPaths("/posts", 8, 4)).toEqual(["/posts", "/posts/2"]);
  });
});

describe("stripResultSlash", () => {
  it("drops the trailing slash a pagefind result carries", () => {
    expect(stripResultSlash("/tags/github/")).toBe("/tags/github");
  });

  it("keeps the hash of a sub-result", () => {
    expect(stripResultSlash("/posts/my-post/#what-closes-it")).toBe(
      "/posts/my-post#what-closes-it"
    );
  });

  it("leaves the root alone rather than emptying it", () => {
    expect(stripResultSlash("/")).toBe("/");
    expect(stripResultSlash("/#top")).toBe("/#top");
  });

  it("leaves a path that already has no trailing slash", () => {
    expect(stripResultSlash("/posts/my-post")).toBe("/posts/my-post");
  });

  it("keeps a query string", () => {
    expect(stripResultSlash("/search/?q=git")).toBe("/search?q=git");
  });
});

describe("searchResultKind", () => {
  it("calls an article a post", () => {
    expect(searchResultKind("/posts/arch-linux-2024-setup")).toBe("Posts");
  });

  it("keeps a sub-result on an article a post", () => {
    expect(searchResultKind("/posts/my-post#why-yay")).toBe("Posts");
  });

  it("calls a tag page a tag", () => {
    expect(searchResultKind("/tags/docker")).toBe("Tags");
  });

  it("treats the listings themselves as pages, not as their contents", () => {
    expect(searchResultKind("/posts")).toBe("Pages");
    expect(searchResultKind("/tags")).toBe("Pages");
  });

  it("falls back to a page for anything else", () => {
    expect(searchResultKind("/nixos")).toBe("Pages");
    expect(searchResultKind("/")).toBe("Pages");
  });
});
