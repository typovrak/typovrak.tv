import { getCollection } from "astro:content";
import { getPostUrl } from "./getPostPaths";
import { getSortedPosts } from "./getSortedPosts";
import { getUniqueTags } from "./getUniqueTags";
import { fileToPath, normalisePath, paginatedPaths } from "./paths";
import { slugifyAll } from "./slugify";
import config from "@/config";

// Resolved by Vite at build, so the function ships the page list rather than
// hitting the filesystem. Dynamic routes are skipped here; their paths are
// derived from the collection below.
const pageFiles = import.meta.glob("/src/pages/**/*.astro");

let cache: Set<string> | undefined;

export async function getKnownPaths(): Promise<Set<string>> {
  if (cache) return cache;

  const paths = new Set<string>();
  const add = (raw: string) => {
    const path = normalisePath(raw);
    if (path) paths.add(path);
  };

  for (const file of Object.keys(pageFiles)) {
    const path = fileToPath(file);
    if (path && path !== "/404") paths.add(path);
  }

  const posts = await getCollection("posts");
  const published = getSortedPosts(posts);
  const { perPage } = config.posts;

  for (const post of published) add(getPostUrl(post.id, post.filePath));
  for (const path of paginatedPaths("/posts", published.length, perPage)) {
    add(path);
  }

  for (const { tag } of getUniqueTags(posts)) {
    const tagged = published.filter(post =>
      slugifyAll(post.data.tags).includes(tag)
    );
    for (const path of paginatedPaths(`/tags/${tag}`, tagged.length, perPage)) {
      add(path);
    }
  }

  cache = paths;
  return cache;
}
