import type { APIRoute } from "astro";
import { postDate, postUrl, sortedPosts, text } from "@/pages/_terminal";
import { renderLlmsIndex, type LlmsEntry } from "@/utils/llms";
import { useTranslations } from "@/i18n";
import config from "@/config";

const site = config.site.url.replace(/\/$/, "");
const t = useTranslations(config.site.lang);

// Hand-listed rather than globbed: an entry is only worth a model's attention
// if it carries content, so the search page and the legal pages stay out.
const pages: LlmsEntry[] = [
  {
    title: t.nav.home,
    url: `${site}/`,
    description:
      "Who writes this site, the Star Rune project I volunteer on, and the open-source repos I contribute to.",
  },
  {
    title: "NixOS config",
    url: `${site}/nixos`,
    description:
      "Every module of the NixOS setup, one repo per tool, with its purpose and the release it targets.",
  },
  {
    title: t.pages.questionsTitle,
    url: `${site}/questions`,
    description: t.pages.questionsDesc,
  },
  {
    title: t.pages.tagsTitle,
    url: `${site}/tags`,
    description: t.pages.tagsDesc,
  },
];

export const GET: APIRoute = async () => {
  const posts = await sortedPosts();
  return text(
    renderLlmsIndex(
      { title: config.site.title, description: config.site.description },
      [
        {
          name: "Posts",
          entries: posts.map(post => ({
            title: post.data.title,
            url: postUrl(post),
            description: `${post.data.description} Published ${postDate(post)}.`,
          })),
        },
        { name: "Pages", entries: pages },
      ],
      [
        `Written by ${config.site.author}. Every post is also served as markdown at its url with a .txt suffix, and the full text of all of them is at ${site}/llms-full.txt.`,
      ]
    )
  );
};
