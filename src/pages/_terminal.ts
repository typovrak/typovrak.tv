// Shared by the text endpoints. Underscore-prefixed so Astro never routes it.
import { getCollection, type CollectionEntry } from "astro:content";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostSlug, getPostUrl } from "@/utils/getPostPaths";
import { readingTime } from "@/utils/readingTime";
import { slugifyStr } from "@/utils/slugify";
import { tagInfo } from "@/data/tags";
import { parsePostBody } from "@/utils/postTree";
import {
  formatDate,
  renderIndex,
  renderPost,
  type Palette,
} from "@/utils/terminal";
import config from "@/config";

type Post = CollectionEntry<"posts">;

const site = config.site.url.replace(/\/$/, "");

const absolute = (post: Post) =>
  site + getPostUrl(post.id, post.filePath, config.site.lang);

const dateOf = (post: Post) =>
  formatDate(
    new Date(post.data.modDatetime ?? post.data.pubDatetime),
    post.data.timezone ?? config.site.timezone
  );

export async function terminalPaths() {
  const posts = getSortedPosts(await getCollection("posts"));
  return posts.map(post => ({
    // posts live at the root of the collection, so the slug has no slash
    params: { slug: getPostSlug(post.id, post.filePath).replace(/^\//, "") },
    props: { post },
  }));
}

export async function postText(post: Post, palette: Palette): Promise<string> {
  const url = absolute(post);
  const tree = await parsePostBody(post.body ?? "", {
    mdx: post.filePath?.endsWith(".mdx") ?? false,
  });
  return renderPost(
    {
      title: post.data.title,
      description: post.data.description,
      date: dateOf(post),
      minutes: readingTime(post.body ?? ""),
      tags: post.data.tags.map(tag => tagInfo(slugifyStr(tag)).label),
      url,
      plainUrl: `${url}.txt`,
      tree,
    },
    { palette, site }
  );
}

export async function indexText(palette: Palette): Promise<string> {
  const posts = getSortedPosts(await getCollection("posts"));
  return renderIndex(
    {
      title: config.site.title,
      description: config.site.description,
      url: site,
    },
    posts.map(post => ({
      title: post.data.title,
      date: dateOf(post),
      minutes: readingTime(post.body ?? ""),
      url: absolute(post),
    })),
    { palette }
  );
}

export const text = (body: string) =>
  new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
