# Promotion

How a post gets distributed once it is live. Written for `arch-linux-2024-setup`,
but it applies to every post.

One rule above all the others: **typovrak.tv is the canonical home**. The full
text ships here first, and every external post links to the article URL, never
to the homepage.

## Where the link points

| Context | Link | Why |
| --- | --- | --- |
| Aggregator submission (Reddit, HN, Lemmy) | `https://typovrak.tv/posts/<slug>` | The submission *is* the article. A homepage link gets removed as blogspam. |
| Comment answering a question | The post, or the exact anchor inside it | Deep link. Nobody hunts through a homepage. |
| Profile bio (GitHub, Mastodon, Bluesky, dev.to) | `https://typovrak.tv` | The only place the homepage belongs. |
| Mirror site (dev.to, Hashnode, Medium) | Full text + `canonical_url` back to the post | See below. |

## Full content on the site, mirrors come after

The site carries the whole article. Mirrors carry the whole article too, with a
canonical tag pointing back, so search engines credit typovrak.tv and the mirror
does not compete with it.

What actually protects the original is the canonical tag, not the order of
publication. Google treats `rel=canonical` as a strong signal rather than an
order of operations, so a mirror published on day 0 with the canonical set is
already pointing at typovrak.tv. Mirroring **without** a canonical is the real
mistake.

So do not block on indexing. The order to follow:

1. Publish on typovrak.tv, check the sitemap lists it, request indexing in
   Search Console.
2. Give it about a week. If Search Console still says "Discovered, currently not
   indexed" or "URL is not on Google", mirror anyway, canonical set.

A new domain with no inbound links gets crawled slowly, and requesting indexing
does not change that. Waiting for indexing that has not happened yet is
circular: the aggregator submissions and the mirrors are what create the links
that get the original crawled in the first place. The technical side is already
correct here (`@astrojs/sitemap` is wired in [astro.config.ts](astro.config.ts),
`robots.txt` points at `sitemap-index.xml` and allows everything), so slow
indexing means no links, not a broken setup.

| Mirror | Canonical field | Notes |
| --- | --- | --- |
| dev.to | `canonical_url:` in the post frontmatter | Also supports RSS auto-import from `https://typovrak.tv/rss.xml`, which fills the canonical on its own and creates drafts. |
| Hashnode | "Original article URL" in post settings | |
| Medium | Import tool at `medium.com/p/import` | Sets `rel=canonical` automatically. Pasting the text by hand does not. |

The `canonicalURL` frontmatter field in this repo is for the opposite case, a
post first published elsewhere. Leave it unset for posts written here.

## Accounts to create

All with `typovrak@gmail.com`, all under the handle `typovrak`, so the identity
stays one person across platforms (see `identity.ts`, same reasoning).

| Platform | URL | For the Arch post | Notes |
| --- | --- | --- | --- |
| Reddit | https://reddit.com | r/archlinux first, r/commandline second | Rules checked, see below. New accounts with zero history get auto-removed by spam filters on most Linux subs, so comment for a week or two first. |
| Hacker News | https://news.ycombinator.com | Submit with the exact post title | No editorialised titles, no "Show HN" (that is for things you built and can be used). Self-submissions are allowed; repeated ones from the same domain get throttled. |
| Lobste.rs | https://lobste.rs | Same submission, tag `linux` | Invite-only. Ask someone who is already a member, or skip it. Tick "authored by me" when submitting your own writing. |
| Lemmy | https://programming.dev, https://lemmy.ml/c/linux | Same submission | Federated, small, friendly to self-hosted blogs. |
| Mastodon | https://fosstodon.org or https://hachyderm.io | Post with `#archlinux #linux #cli` | Hashtags are the entire discovery mechanism there. |
| Bluesky | https://bsky.app | Short thread + link | |
| dev.to | https://dev.to | Mirror, canonical set | |
| Hashnode | https://hashnode.com | Mirror, canonical set | |
| Google Search Console | https://search.google.com/search-console | Index the post | Verify the domain by DNS TXT record in the Vercel DNS settings. |
| Bing Webmaster Tools | https://www.bing.com/webmasters | Same | Feeds Bing, DuckDuckGo and ChatGPT search. Can import the Search Console verification. |

Do not add any of these to `astro-paper.config.ts`. The site lists GitHub and
mail only, and that stays.

## How to submit

- **Title**: the post title as written, unchanged. Both HN and Reddit remove
  editorialised or clickbait titles.
- **First comment**: post one yourself, saying what the setup is and what you
  would do differently now. Then stay for the replies. A link dropped and
  abandoned gets no traction and reads as spam.
- **Never** paste the full article as a Reddit self-post next to the link. It is
  duplicate content and it removes the reason to click.
- **Ratio**: keep your own links well under a tenth of your activity on any
  community. Reddit and Lobsters both enforce this socially, and Reddit
  sometimes automatically.

## Before submitting anywhere

- [ ] `pnpm lint && pnpm test && pnpm format:check && pnpm build` pass
- [ ] The post is live at its real URL, with no trailing slash
- [ ] The OG card shows the site banner. It is the same on every page and every
      post, by design, so there is nothing to set per post.
- [ ] Preview the card in https://www.opengraph.xyz before posting
- [ ] Submitted to Search Console and Bing Webmaster Tools
- [ ] The RSS feed lists it: https://typovrak.tv/rss.xml

## Reddit, sub by sub

Rules read from each subreddit's own rules page. Recheck before posting, they
move.

| Sub | Verdict | The rule that decides it |
| --- | --- | --- |
| r/archlinux | Post here first | No rule against self-promotion or blog links at all. Rule 1 says "Articles, support questions or posts not directly related to Arch Linux are not allowed", so articles are expected, they just have to be about Arch itself. Rule 4 removes low-effort posts, rule 2 sends customisation screenshots to r/unixporn. |
| r/commandline | Second, a few days later | Rule 2 removes "low quality blog-spam", rule 3 caps you at 3 posts a day and bans indirect links. A setup article passes on the zsh, zinit and CLI content. |
| r/linux | Only once the account has history | Rule 6 is explicit: "no more than 10% of your posts should be your content", and it requires you to answer the comments on your own submission. Rule 2 removes blogspam and demands the original source with the original title. Rule 1 rejects anything that reads as a support question. |
| r/unixporn | No | Rule 1 accepts guides tagged [OC], but rule 3 requires significant customisation and names "KDE/GNOME with minor theme/color changes" as an example of what gets removed. A stock GNOME setup does not qualify. |

Two rules to take seriously before submitting anywhere:

- **AI-generated posts are banned outright.** r/archlinux rule 5 and
  r/commandline rule 4 both remove posts whose text or title is AI-generated.
  Run the `avoid-ai-writing` skill over the article and write the submission
  title and first comment yourself.
- **The post is dated.** The Arch article describes a 2024 setup and says in its
  own title that the author has since moved to NixOS. Expect "this is outdated"
  in the comments and answer it directly rather than defending it.

## Reusing a post afterwards

The article keeps working after launch week. Answer a real question on Reddit,
Stack Overflow or a GitHub issue, and link the section that answers it. That is
where most of the long-tail traffic comes from, and it does not decay the way a
front page does.
