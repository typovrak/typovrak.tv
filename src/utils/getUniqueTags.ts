import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { uniqueTags } from "./uniqueTags";

/**
 * Builds a de-duplicated, sorted tag list from posts.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `tag` is the slug used in URLs; `tagName` is the original label for display
 * - Uniqueness is based on the slug (so differently-cased labels collapse)
 */
export function getUniqueTags(posts: CollectionEntry<"posts">[]) {
  return uniqueTags(posts.filter(postFilter).flatMap(post => post.data.tags));
}
