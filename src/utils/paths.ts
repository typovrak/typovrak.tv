// Pure path helpers, kept free of `astro:content` so they stay unit-testable.

const DUMMY_ORIGIN = "https://example.invalid";

export function normalisePath(raw: string): string | null {
  if (!raw.startsWith("/") || raw.length > 255) return null;
  try {
    const { pathname } = new URL(raw, DUMMY_ORIGIN);
    return pathname.replace(/\/+$/, "") || "/";
  } catch {
    return null;
  }
}

/** Maps a `src/pages` file to its route, or null when the route is not static. */
export function fileToPath(file: string): string | null {
  const rel = file.replace(/^\/src\/pages/, "").replace(/\.astro$/, "");
  const segments = rel.split("/");
  if (segments.some(s => s.startsWith("_") || s.startsWith("["))) return null;
  const path = rel.replace(/\/index$/, "");
  return path === "" ? "/" : path;
}

/** Mirrors Astro's `paginate()`: page 1 has no suffix, page N lives at `/base/N`. */
export function paginatedPaths(
  base: string,
  total: number,
  pageSize: number
): string[] {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return Array.from({ length: pages }, (_, i) =>
    i === 0 ? base : `${base}/${i + 1}`
  );
}
