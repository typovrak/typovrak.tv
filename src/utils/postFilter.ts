import type { CollectionEntry } from "astro:content";
import { isPostPublished } from "./postVisibility";
import config from "@/config";

// Excludes drafts always. In production, hides scheduled posts until
// `pubDatetime` minus the configured margin. In dev, shows every non-draft.
export function postFilter({ data }: CollectionEntry<"posts">) {
  return isPostPublished(data, {
    now: Date.now(),
    margin: config.posts.scheduledPostMargin,
    isDev: import.meta.env.DEV,
  });
}
