---
title: "Serving a blog post to curl: ANSI text from a static Astro site"
pubDatetime: 2026-10-01T00:00:00+02:00
featured: true
draft: false
tags:
  - astro
  - cli
  - web
description: "curl typovrak.tv/posts/<slug> gets the post as coloured terminal text and a browser keeps the HTML. One Vercel rewrite on the user-agent, two prerendered text files per post, no function."
quiz:
  - q: "How does the site decide to send text instead of HTML?"
    options:
      - "It reads the Accept header"
      - "A Vercel rewrite matches the user-agent against a closed list"
      - "A serverless function sniffs the client"
      - "A query string like ?format=txt"
    correct: [1]
    explain: "A route in the Build Output config carries a has condition on the user-agent header, with the regex (curl|[Ww]get|HTTPie|xh)/.*. Anything else, PowerShell included, gets the HTML."
  - q: "Why are there two text files per post?"
    options:
      - "One for mobile, one for desktop"
      - "One with ANSI colour for a terminal, one plain for redirecting into a file"
      - "One is a cache of the other"
      - "The .txt is for search engines"
    correct: [1]
    explain: "Escape codes pollute a file the moment you redirect the output, so the plain .txt stays reachable by its own url and the .ansi.txt is what the rewrite serves."
  - q: "Where does the renderer get the markdown tree from?"
    options:
      - "It parses the html back into markdown"
      - "A separate markdown parser with its own rules"
      - "A remark plugin that captures the tree from Astro's own processor"
      - "The file is read raw and split on newlines"
    correct: [2]
    explain: "parsePostBody builds Astro's processor with createMarkdownProcessor and slips in a plugin whose only job is to keep a reference to the root, so tables and callouts parse exactly as on the site."
  - q: "Why is remark-mdx only switched on for .mdx files?"
    options:
      - "It is slow"
      - "The mdx grammar reads {braces} in prose as an expression"
      - "Astro forbids it on .md"
      - "It drops code blocks"
    correct: [1]
    explain: "A .md post may hold ${} in a Nix snippet or raw <details> html; the mdx parser would read the braces as an expression and the html as jsx."
  - q: "Why does the ANSI palette use only the 16 standard colours?"
    options:
      - "Vercel strips 256-colour codes"
      - "The terminal's own theme then picks the shade, so a light background stays readable"
      - "curl cannot display more"
      - "less -R supports nothing else"
    correct: [1]
    explain: "Code 32 means whatever green the terminal theme defines. A truecolour value would look right on one background and unreadable on another."
  - q: "Which of these does the terminal text pipeline also produce?"
    multiple: true
    options:
      - "/llms-full.txt"
      - "The RSS feed"
      - "/posts/<slug>.txt as markdown"
      - "The OG images"
    correct: [0, 2]
    explain: "The plain palette emits valid markdown, so the same renderer writes the .txt variant and the body of every post in llms-full.txt. RSS and OG images have their own code."
---

`curl typovrak.tv/posts/github-workflow-in-the-terminal` prints the post as coloured text, 80 columns wide, with its headings, tables, callouts and code blocks intact. A browser asking for the same URL gets the HTML. The switch is one rewrite rule in the Vercel config, keyed on the user-agent, in front of two prerendered text files per post. No function runs and no JavaScript is involved.

I shipped it on 2 September 2026 in [one commit](https://github.com/typovrak/typovrak.tv/commit/c6493703c8c4a5251d2b837dc1cc913432a8400e) of 1,201 lines, about half of them tests. This post is how it works, what went wrong on the way, and the two lines that let a static host do it at all.

Everything below is Astro 7.0.3 with `@astrojs/vercel` 11.0.3, `remark-mdx` 3.1.1, and the live site as of 4 September 2026.

<!-- TODO asciinema, same spot as the gh post (before the TOC, with a thumbnail).
Cast: curl typovrak.tv, then curl typovrak.tv/posts/github-workflow-in-the-terminal | less -R,
scroll a table and a callout, quit, then curl -A Mozilla/5.0 ... | head -3 to show the html coming back.
Markers: curl typovrak.tv / curl post | less -R / browser user-agent.
Needs the file renamed to .mdx and the AsciinemaPlayer import.
Cast at /casts/curl-typovrak-tv.cast,
thumbnail at /img/posts/serving-a-blog-to-curl/curl-post-in-terminal-ansi.avif -->

## Table of contents

## What does curl get from this site?

The post, as text with colour, followed by three lines telling you where else it lives:

```console
$ curl typovrak.tv/posts/github-workflow-in-the-terminal
From issue to merge in the terminal: the git and gh workflow
1 Sep, 2026 · 5 min read · CLI, git, GitHub, Open source

The issue-to-merge loop is nine commands in git and gh. The catch: the branch
linked to an issue does not close it, only a Closes keyword in the PR body does.

────────────────────────────────────────────────────────────────────────────────

Filing an issue, branching, opening the pull request and merging it all run in
git and gh, with no browser tab open. The whole loop is nine commands.
...
────────────────────────────────────────────────────────────────────────────────
Online: https://typovrak.tv/posts/github-workflow-in-the-terminal
Plain text: https://typovrak.tv/posts/github-workflow-in-the-terminal.txt
Read from the top: curl -s https://typovrak.tv/posts/github-workflow-in-the-terminal | less -R
```

<!-- TODO screenshot: that command in your terminal, the green title, a table and a callout visible in one frame.
/img/posts/serving-a-blog-to-curl/curl-post-in-terminal-ansi.avif
alt: curl on a typovrak.tv post in a terminal, title in bold green, a table and a callout rendered as text -->

The footer exists because a terminal lands on the end of the output, so the last line is the first one you read. It hands you the command that pages the same thing from the top: `less -R` lets the colour codes through instead of printing them as `ESC[1;32m`.

The root does the same for the post list:

```console
$ curl typovrak.tv
typovrak
Notes on Arch Linux, NixOS, CLI tooling and web development, written up from
problems I had to solve myself.

Posts

1 Sep, 2026   From issue to merge in the terminal: the git and gh workflow
              5 min read https://typovrak.tv/posts/github-workflow-in-the-terminal
...
```

The text weighs 11 KB where the HTML of the same post weighs 108 KB, and none of the 108 is needed to read it.

## How does the server tell curl from a browser?

By the `User-Agent` header, matched against a closed list. The whole mechanism is one route in Vercel's [Build Output config](https://vercel.com/docs/build-output-api/configuration), added after the build by [scripts/terminal-routes.mjs](https://github.com/typovrak/typovrak.tv/blob/main/scripts/terminal-routes.mjs):

```js
const terminalClient = [
  { type: "header", key: "user-agent", value: "(curl|[Ww]get|HTTPie|xh)/.*" },
];

const routes = [
  { src: "^/$", has: terminalClient, dest: "/index.ansi.txt" },
  { src: "^/posts/([^./]+)$", has: terminalClient, dest: "/posts/$1.ansi.txt" },
];
```

`has` is a condition on the request: the route only fires when the header matches the regex. `dest` is a rewrite, so the URL in the terminal stays `/posts/<slug>` and the file served is `/posts/<slug>.ansi.txt`. Four clients are on the list, [curl](https://curl.se/docs/manpage.html), [wget](https://www.gnu.org/software/wget/), [HTTPie](https://httpie.io/) and [xh](https://github.com/ducaale/xh), because those are the ones whose default user-agent is a bare `name/version` and whose users are sitting at a terminal.

Five things I checked against the live site, since a regex in someone else's matcher is a regex you have not read the semantics of:

| User-agent sent                       | Served       | What it shows                                              |
| ------------------------------------- | ------------ | ---------------------------------------------------------- |
| `curl/8.12.1`                         | `text/plain` | The normal case                                            |
| `curl/1.0 foo`                        | `text/plain` | The trailing `.*` covers anything after the version        |
| `foo curl/1.0`                        | `text/html`  | The match is anchored at the start of the header           |
| `CURL/8.0`, `WGET/1.0`                | `text/plain` | Vercel compares case-insensitively, so `[Ww]` is redundant |
| `curl` alone, `PowerShell/7.4`, empty | `text/html`  | No slash, or not on the list, so the HTML                  |

The `[^./]+` in the post route is doing two jobs. The dot keeps `/posts/<slug>.txt` out of the rewrite, so the text files stay reachable by their own URLs. The slash is there because posts sit at the root of the collection and a slug never contains one.

The route sits before Vercel's `filesystem` handler, so the rewritten path is what gets looked up on disk, and after the headers route that [security-headers.mjs](https://github.com/typovrak/typovrak.tv/blob/main/scripts/security-headers.mjs) inserts first. The build script runs the two in that order on purpose.

> [!TIP] Why the user-agent and not the Accept header
> `curl` sends `Accept: */*` and so does `wget`, so content negotiation has nothing to negotiate on. The user-agent is the only header a command-line client sends that says what it is. It is also the header a script can override in one flag, `curl -A Mozilla/5.0`, which is the escape hatch when you do want the HTML in a pipe.

One consequence of the site's `trailingSlash: "never"`: `curl typovrak.tv/posts/<slug>/` gets a 308 to the slash-free URL and an empty body, and only `curl -L` follows it to the text. The rewrite fires on the second request.

## Why prerender two text files per post?

Because ANSI escape codes are the right output for a terminal and the wrong output for a file. Every post is built twice by two [static endpoints](https://docs.astro.build/en/guides/endpoints/#static-file-endpoints):

| URL                             | Palette | For                                                |
| ------------------------------- | ------- | -------------------------------------------------- |
| `/posts/<slug>.ansi.txt`        | `ansi`  | What the rewrite serves to a terminal              |
| `/posts/<slug>.txt`             | `plain` | `curl -o post.md`, a pager without `-R`, or an LLM |
| `/index.ansi.txt`, `/index.txt` | both    | The post list, same split                          |

My first plan, written in a TODO before any code, was one file plus a `?raw` query string to switch the colour off. That cannot work on a static host: a query string never reaches a file on disk. Two files cost nothing at build time and each one has a stable URL, so that is what shipped.

The endpoints are eight lines each. [\_terminal.ts](https://github.com/typovrak/typovrak.tv/blob/main/src/pages/_terminal.ts) does the shared work, underscore-prefixed so Astro never routes it:

```ts file="src/pages/posts/[slug].ansi.txt.ts"
import type { APIRoute } from "astro";
import { postText, terminalPaths, text } from "@/pages/_terminal";
import { ansi } from "@/utils/terminal";

export const getStaticPaths = terminalPaths;

export const GET: APIRoute = async ({ props }) =>
  text(await postText(props.post, ansi));
```

`text()` returns a `Response` with `content-type: text/plain; charset=utf-8`, but in a static build only the body survives as a file. The `.txt` in the route filename is what makes Vercel serve it as `text/plain`, and that matters because the site sends `X-Content-Type-Options: nosniff` on everything, so a wrong type would not be guessed around.

Nothing here opts out of prerendering. The database rule on this site is that only a route touching Neon gets `prerender = false`, and a text file touches nothing.

## How is the markdown turned into terminal text?

In two steps: capture the markdown tree from Astro's own processor, then walk it with a renderer that knows nothing about Astro.

The capture is the part that took a while to get right. Astro's `render()` hands back HTML and nothing else, and turning HTML back into text loses the structure the terminal needs. Parsing the markdown a second time with a different parser would work until a table or a callout parsed differently from the site. So [postTree.ts](https://github.com/typovrak/typovrak.tv/blob/main/src/utils/postTree.ts) builds the same processor the site uses and slips in a remark plugin whose only job is to keep a reference to the root:

```ts
let tree: Node | undefined;
const capture = () => (root: Node) => {
  tree = stripMdx(root);
};
const processor = await createMarkdownProcessor({
  gfm: true,
  smartypants: false,
  syntaxHighlight: false,
  remarkPlugins: options.mdx ? [remarkMdx, capture] : [capture],
});
await processor.render(body);
```

`smartypants: false` is not cosmetic. With it on, a `--rebase` in prose becomes an en dash and a `"` becomes a curly quote, and a reader pasting a command out of the text gets a broken command. `syntaxHighlight: false` skips Shiki, which only produces HTML anyway.

`remarkMdx` is only in the chain for `.mdx` files. The MDX grammar reads `{braces}` in prose as a JavaScript expression, and a `.md` post on this site holds `${pkgs.prisma-engines_6}` in a Nix snippet and raw `<details>` blocks that MDX would read as JSX. For a real `.mdx` post, `stripMdx` then drops the nodes that carry no prose and unwraps the ones that might:

```ts
const DROP = new Set(["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"]);
const UNWRAP = new Set(["mdxJsxFlowElement", "mdxJsxTextElement"]);
```

An `import` line, an `export const markers = [...]`, and the `<AsciinemaPlayer />` element go. A `<div>` wrapped around markdown is replaced by its children, so nothing inside it is lost.

The renderer, [terminal.ts](https://github.com/typovrak/typovrak.tv/blob/main/src/utils/terminal.ts), is 544 lines with no `astro:*` import, which is what keeps it under vitest. It walks the tree block by block:

- Paragraphs are word-wrapped at 80 columns. A word longer than the line gets a line of its own rather than being cut, and each word keeps its style across a break.
- Code blocks are never wrapped. They open with a dim `─── bash ────` rule and close with another, so a long line scrolls sideways instead of breaking a command.
- Links print their label, then the absolute URL in dim parentheses. An anchor link prints only its label. An image becomes `[image: alt] (url)`.
- Tables are padded to their widest cell, joined with a pipe between two spaces, with a dashed separator under the header and right-aligned columns honoured. Width is measured after stripping escape codes, or a coloured cell would misalign the column.
- A callout, the `> [!TIP] Title` syntax the site renders through rehype-callouts, becomes a labelled quote: `TIP` in green, `WARNING` and its cousins in yellow, the title in bold, the body on its own lines under a `│` bar.
- The `## Table of contents` heading, which remark-toc fills in on the site, is replaced by a bullet list of the headings that follow it.
- Raw HTML keeps its text and drops its tags, so a `<details>` block reads as its summary and its content. An HTML comment renders as nothing.

Blocks are separated by exactly one blank line, and a block that renders to nothing leaves no gap behind.

## Which ANSI codes, and why only sixteen colours?

The palette is nine [SGR codes](https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters) and nothing from the 256-colour or truecolour ranges:

| Element                 | Code   | Meaning          |
| ----------------------- | ------ | ---------------- |
| Title, `h1`, `h2`       | `1;32` | bold, green      |
| `h3` and deeper, strong | `1`    | bold             |
| Emphasis                | `3`    | italic           |
| Inline code             | `36`   | cyan             |
| Link                    | `4;32` | underline, green |
| Metadata, URLs, rules   | `2`    | dim              |
| Callout label           | `32`   | green            |
| Warning label           | `33`   | yellow           |

Code 32 does not mean a specific green. It means whatever green the terminal's theme defines, which on my machine is Catppuccin Mocha's and on yours is yours. A truecolour value would reproduce the site's exact accent and then be unreadable on a light background. Sixteen colours let the reader's theme decide, which is the same reason the site itself keeps its accent to one CSS token.

Every styled run is closed with `\x1b[0m`, and an empty string gets no codes at all, so two adjacent runs of the same style merge into one before painting. `visibleLength()` strips the codes to measure text, which is what wrapping and table alignment call.

The plain palette maps the same nine slots to markdown: `#` for headings, triple backticks for code, `-` for bullets, `>` for quotes. That choice paid off a day later, see below.

## How is it tested?

With vitest, against hand-built trees, and by breaking the code to watch the test go red. The two test files are 455 lines for 590 lines of code. A few of the cases, because they are the ones that caught real bugs:

- No line of a wrapped paragraph passes the width, and a word longer than the width lands on its own line.
- A code block comes out byte for byte, never wrapped.
- A table with a right-aligned column pads on the left, and a coloured cell still aligns.
- A callout title keeps its inline code, and a code block inside a callout body keeps its fences.
- The plain palette emits no escape code at all, checked by regex over the whole output.
- An `.mdx` body loses its `import`, its `export`, its JSX and its `{expressions}` and keeps every word of prose.
- A `.md` body keeps raw `<details>` as text instead of reading it as JSX.
- The date is formatted in the post's timezone, so a post published at midnight in Paris does not print the day before.

What the unit tests cannot check is the rewrite. The Build Output config is only read by Vercel, so the user-agent switch has to be verified on a preview deploy with a browser and `curl` on the same URL. The table in the second section is that check, run against production.

## Where else does the text pipeline get used?

In [/llms.txt](https://typovrak.tv/llms.txt) and [/llms-full.txt](https://typovrak.tv/llms-full.txt), the two files from [llmstxt.org](https://llmstxt.org/) that give a language model a markdown index of the site and the full text of every post. They shipped on 3 September, the day after the terminal commit, and the whole of `llms-full.txt` is the same `renderTree()` call with the `plain` palette:

```ts
body: renderTree(await postTree(post), { palette: plain, site }),
```

The plain output was already valid markdown, so there was no second renderer to write. Fenced code, `## ` headings, `- ` lists, `> ` quotes and GFM tables without their outer pipes all come out of the same walker.

## Who else does this?

[wttr.in](https://wttr.in/) and [cheat.sh](https://cheat.sh/), both by Igor Chubin, are the ones I learned it from. Checked on 4 September 2026, each of them answers `text/plain` to a `curl/8.12.1` user-agent and `text/html` to a Firefox one, on the same URL. wttr.in goes further and paints the weather in 256 colours. [rate.sx](https://rate.sx/), from the same author, returned HTML to both when I tried.

Those are services with a server behind them. The point of this post is that a static site can do the same with a rewrite rule and two extra files per page, and that the rendering is the part worth the effort. The switch is two lines.

## Try it

```bash
curl typovrak.tv
curl typovrak.tv/posts/github-workflow-in-the-terminal | less -R
curl -o post.md typovrak.tv/posts/github-workflow-in-the-terminal.txt
curl -A Mozilla/5.0 typovrak.tv/posts/github-workflow-in-the-terminal | head -3
```

The first two read in the terminal. The third saves the markdown without a single escape code. The fourth is how you get the HTML back from a script, since the switch is keyed on nothing but the user-agent.

<!-- TODO screenshot (optional): the plain .txt opened in Neovim, showing it is markdown.
/img/posts/serving-a-blog-to-curl/plain-txt-variant-is-markdown-in-neovim.avif
alt: The .txt variant of a post open in Neovim, plain markdown with fenced code blocks and a GFM table -->
