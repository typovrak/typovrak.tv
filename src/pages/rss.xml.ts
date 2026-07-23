import rss from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import { slugifyStr } from "@/utils/slugify";
import { tagInfo } from "@/data/tags";
import config from "@/config";

const site = config.site.url;

// Feed readers resolve nothing: every link and image has to be absolute.
const absolutise = (html: string) =>
  html.replace(/(href|src)="\/(?!\/)/g, `$1="${site}`);

// RSS wants an email in <author>; skip the field entirely rather than emit a
// bare name, which validators reject.
const mail = config.socials
  .find(social => social.name === "mail")
  ?.url.replace(/^mailto:/, "");
const author = mail ? `${mail} (${config.site.author})` : undefined;

export async function GET() {
  const posts = await getCollection("posts");
  const sortedPosts = getSortedPosts(posts);

  // Renders each post through the real pipeline, so the feed carries the same
  // HTML as the site (Shiki highlighting included) with no extra dependency.
  const container = await AstroContainer.create();

  const items = await Promise.all(
    sortedPosts.map(async post => {
      const { Content } = await render(post);
      return {
        link: getPostUrl(post.id, post.filePath, config.site.lang),
        title: post.data.title,
        description: post.data.description,
        pubDate: new Date(post.data.modDatetime ?? post.data.pubDatetime),
        // Registry labels, so the feed shows Arch Linux rather than arch-linux.
        categories: post.data.tags?.map(tag => tagInfo(slugifyStr(tag)).label),
        author,
        content: absolutise(await container.renderToString(Content)),
      };
    })
  );

  return rss({
    title: config.site.title,
    description: config.site.description,
    site,
    // The site is trailingSlash: never, so the feed must not add one.
    trailingSlash: false,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: [
      `<language>${config.site.lang}</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${new URL("rss.xml", site).href}" rel="self" type="application/rss+xml"/>`,
    ].join(""),
    items,
  });
}
