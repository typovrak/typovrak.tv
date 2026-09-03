import type { APIRoute } from "astro";
import {
  postDate,
  postTags,
  postTree,
  postUrl,
  sortedPosts,
  text,
} from "@/pages/_terminal";
import { renderLlmsFull } from "@/utils/llms";
import { sitePages } from "@/pages/_llmsPages";
import { plain, renderTree } from "@/utils/terminal";
import config from "@/config";

const site = config.site.url.replace(/\/$/, "");

export const GET: APIRoute = async () => {
  const posts = await sortedPosts();
  const documents = await Promise.all(
    posts.map(async post => ({
      title: post.data.title,
      url: postUrl(post),
      description: post.data.description,
      date: postDate(post),
      tags: postTags(post),
      // the plain palette emits markdown, so no second renderer is needed
      body: renderTree(await postTree(post), { palette: plain, site }),
    }))
  );

  return text(
    renderLlmsFull(
      { title: config.site.title, description: config.site.description },
      // the pages first: they are short and say who wrote the posts that follow
      [...sitePages(), ...documents],
      [
        `Every page and the full text of every published post, newest first. Written by ${config.site.author}. The index is at ${site}/llms.txt.`,
      ]
    )
  );
};
