import { slugifyStr } from "./slugify";

// Pure slug logic, split from getPostPaths (which imports astro:i18n) so it
// stays unit-testable. A post URL never changes once published, so this is
// worth locking down.

export function postPathSegments(
  filePath: string | undefined,
  blogPath: string
): string[] {
  return (
    filePath
      ?.replace(blogPath, "")
      .split("/")
      .filter(path => path !== "")
      .filter(path => !path.startsWith("_"))
      .slice(0, -1)
      .map(segment => slugifyStr(segment)) ?? []
  );
}

export function idSlug(id: string): string {
  const parts = id.split("/");
  return parts.length > 0 ? String(parts[parts.length - 1]) : id;
}

export function postSlugPath(
  id: string,
  filePath: string | undefined,
  blogPath: string
): string {
  const segments = postPathSegments(filePath, blogPath);
  const slug = idSlug(id);
  return segments.length > 0 ? [...segments, slug].join("/") : String(slug);
}
