# typovrak.tv

Personal developer blog of typovrak (Morgan Scholz). 100% technical, nerd-oriented content:
how to use a given technology, how to install and configure Arch Linux, which CLI tools I use
and why, deep dives into the stack. No lifestyle content, no marketing content.

The site is **English-only, permanently**. There is no localization plan — do not add locales,
translated content trees, or locale-prefixed routes. `src/i18n/` exists only as the UI string
table for AstroPaper; treat it as a plain constants file.

## Origin

This repo is a fork of [AstroPaper v6](https://github.com/satnaing/astro-paper) by Sat Naing
(`upstream` remote), reshaped into a personal site. The demo content, upstream docs and Sat
Naing's config values have been removed. If anything upstream-branded resurfaces (e.g. after
merging from `upstream`), it is leftover, not intentional — the one deliberate exception is the
attribution in [LICENSE](LICENSE) and [README.md](README.md), which must stay.

## Stack

- **Astro 7** with **MDX** — content collections, file-based routing
- **Tailwind CSS 4** (via `@tailwindcss/vite`, no `tailwind.config.js` — theme lives in CSS)
- **Pagefind** — client-side static search, indexed at build time
- **satori + sharp** — dynamic OG images generated at build
- **Shiki** — code highlighting with custom transformers in [src/utils/transformers/](src/utils/transformers/)
- **TypeScript** — strict; `astro check` runs as part of the build
- Node >= 22.12, **pnpm** as the only package manager

## Deployment

**Vercel**, via `@astrojs/vercel` with `output: "static"`. Do not add a different adapter or a
`netlify.toml`, and do not switch to `output: "server"`.

`"static"` does not mean no server. Pages are prerendered by default and a route opts into a
Vercel function with `export const prerender = false`. A content blog should stay prerendered:
`output: "server"` would make every page a function and force `prerender = true` everywhere to
undo it. Only API routes touching the database need to opt out.

Files under `src/pages/` whose name starts with `_` are not routed at all, so an endpoint named
`_probe.ts` silently produces no function.

## Database

**Neon** (serverless Postgres) via `@neondatabase/serverless`, reached through
[src/utils/db.ts](src/utils/db.ts). Only ever from routes with `prerender = false`.

Stick to vanilla Postgres. No vendor-specific features, so the host stays swappable via
`pg_dump`.

The HTTP driver (`neon()`) sends each query as a one-shot fetch, which is what makes it fit
serverless: nothing to pool, nothing to leak when a function freezes. The trade-off is no
session, so no LISTEN/NOTIFY, no cursors and no interactive transactions.
`sql.transaction([...])` batches into one non-interactive transaction, which is enough for a
read-modify-write counter. If a session is ever genuinely needed, switch to `Pool` from the same
package.

**Queries must be tagged templates** — `` sql`... WHERE slug = ${slug}` `` — which parameterises
the values. The plain-call form `sql("SELECT ...")` shown in Neon's dashboard is a JS starter
snippet and does not type-check here. Use `sql.query("... WHERE slug = $1", [slug])` when the
query is built at runtime. Never concatenate SQL.

`DATABASE_URL` is declared in the `astro:env` schema as `access: "secret", context: "server"`,
so importing it from client code is a build error rather than a leak. It lives in `.env`
locally (gitignored, see [.env.example](.env.example)) and in the Vercel project settings for
deploys. Never paste a connection string into source, chat or a commit.

Note when touching the build: `pnpm build` runs `astro check && astro build && pagefind --site dist`
then copies the Pagefind index into `public/`. Pagefind indexes the built output, so search only
reflects what exists after a full build.

## Commands

Development runs **in Docker**, not on the host:

```sh
docker compose up        # pnpm dev on http://localhost:4321
```

Everything else via pnpm (inside the container or on the host, but never npm/npx/bun — the repo
is pnpm-only and a stray `package-lock.json` is a mistake, not a fallback):

```sh
pnpm lint          # eslint
pnpm format        # prettier --write
pnpm format:check  # prettier --check (what CI runs)
pnpm build         # astro check + astro build + pagefind
```

## Before proposing a commit

Run all three, and report real results — CI runs exactly these and nothing else:

```sh
pnpm lint && pnpm format:check && pnpm build
```

## Git workflow

- **Never put a double quote (`"`) in a commit message.** Not in the subject, not in the body.
  Commits are written with `git commit -m "..."`, so a `"` terminates the message early and
  mangles it. Use single quotes, backticks, or no quotes at all. Apostrophes are fine.
- **Never add a `Co-Authored-By` trailer**, or any other authorship trailer, to a commit. This
  overrides the default Claude Code behaviour of appending one. The commits are typovrak's.
- **Never commit directly to `main`.** Always work on a branch, then open a PR.
- **Conventional commits**, enforced by commitizen ([cz.yaml](cz.yaml)): `feat:`, `fix:`,
  `refactor:`, `chore:`, `docs:`. The changelog and version bumps are derived from them, so the
  prefix is load-bearing, not cosmetic.
- Branch naming follows the commit type: `type/short-description`, e.g. `feat/comments-section`,
  `fix/og-fallback`, `refactor/astro-paper-template`, `chore/...`, `docs/...`. Lowercase, hyphens,
  no issue numbers as a prefix. Delete the branch once it is merged.
- `origin` is `typovrak/typovrak.tv`. `upstream` is the AstroPaper repo — never push there.

### Archived history

Dead work is kept as annotated `archive/*` **tags**, not branches. A tag is a fixed point in
history, so it never shows up in the branch list, never goes stale, and keeps its commits safe
from garbage collection. Branches are for work in progress only.

The Go version of the site (wiped by `refactor: fresh start with nothing`) lives in these tags,
all pre-dating the Astro rewrite:

- `archive/golang-version` — the Go site as it stood before the wipe, also an ancestor of `main`
- `archive/init-api` — Go API, routing, Prometheus and Grafana. Never merged
- `archive/finish-testing` — Go test suite, makefiles, coverage. Never merged
- `archive/go-templating` — Go templating engine experiment. Never merged, abandoned

Restore one with `git switch -c <branch> archive/<tag>`. Never delete these tags.

## Content

Posts live in [src/content/posts/](src/content/posts/) as `.md` or `.mdx`, one file per post at
the root of that directory.

Only files whose **name** starts with `_` are excluded from the collection. The glob in
[src/content.config.ts](src/content.config.ts) is `**/[^_]*.{md,mdx}`, and `**` happily traverses
underscore-prefixed directories — so a `_drafts/my-post.md` **would be published**. Don't rely on
the directory name; prefix the file.

Two upstream posts are kept as unpublished reference, `_`-prefixed so they stay out of the site:

- [\_adding-new-post.mdx](src/content/posts/_adding-new-post.mdx) — frontmatter rules and post conventions
- [\_markdown-syntax.md](src/content/posts/_markdown-syntax.md) — how markdown/prose renders in this theme

They are Sat Naing's writing. Read them, don't publish them and don't reattribute them.

Frontmatter schema is defined in [src/content.config.ts](src/content.config.ts). Required:
`title`, `description`, `pubDatetime`. Notable optional fields: `modDatetime`, `featured`,
`draft`, `tags`, `ogImage`, `canonicalURL`.

**Tags are flat and free-form** — no categories, no series, no controlled vocabulary. Pick what
fits the post (`arch-linux`, `neovim`, `docker`, ...). Tag pages are generated automatically.

Static pages (`about`) live in [src/content/pages/](src/content/pages/).

## Site configuration

[astro-paper.config.ts](astro-paper.config.ts) is the single source of truth for identity,
feature flags and socials. It is filled in: URL `https://typovrak.tv/`, author `typovrak`,
timezone `Europe/Paris`, GitHub and mail as the only socials.

**No other social links** — no X, LinkedIn, Malt, Instagram, TikTok. Do not add socials that
were not asked for.

`site.ogImage` is intentionally unset and there is no static OG file. With
`features.dynamicOgImage` on, [resolveDefaultOgImagePath.ts](src/utils/resolveDefaultOgImagePath.ts)
falls back to the satori-generated `/og.png`. If you ever turn `dynamicOgImage` off, the build
will fail until a real file is added to `public/`. SEO work is deferred, so don't add meta,
schema or OG assets unprompted.

## Theme

Catppuccin: **Latte** in light mode, **Mocha** in dark, **green** as the accent in both. The
seven design tokens in [src/styles/theme.css](src/styles/theme.css) are the only place colors
are defined — no hex values anywhere else, and Tailwind 4 has no JS config to hold a palette.
Code blocks use the `catppuccin-latte` / `catppuccin-mocha` Shiki themes.

Accessibility is a hard requirement: **target WCAG AAA (7:1)**, and never regress below AA.
`--accent` is used mostly as a *text* color (post titles, links, tags, 404), so it must clear
the text threshold against `--background`, not just the 3:1 UI threshold.

This is why light mode's `--accent` is `#255c19` and not Catppuccin's `#40a02b`: the official
Latte green only reaches 2.96:1 on Latte base. `#255c19` keeps the exact hue (109.2°) and
saturation (57.6%) and drops lightness to 23%, reaching 7.08:1. **Do not "fix" it back to the
stock value.** Mocha green needs no adjustment (11:1).

Verify contrast when changing any token — compute the ratios, don't eyeball them.

## Writing (site copy, posts, README)

Plain, direct, technical. Short declarative sentences. State the thing, then move on.
Assume the reader is a competent developer — don't set scenes, don't build up, don't sell.

Banned, because they are what makes text read as AI-written:

- **Em dashes** (`—`). Use a period, a comma, or parentheses.
- **Triads** — three-item lists used for rhythm ("Linux, the CLI tools I use, and the web
  stack"). Two items, or four, or a real bulleted list.
- **"Not X, but Y" / "It's not just X, it's Y" / "X isn't Y. It's Z."** Any antithesis used for
  punch. Say what it is; drop the contrast.
- **Closing punchlines.** No short fragment landing at the end of a section ("Just tech.", "Every
  penny counts."). End when the information ends.
- **Fake intimacy** — "the kind of post I wish I'd found", "the notes I wish someone had given
  me", any implied shared feeling with the reader.
- **Marketing verbs**: dive into, delve, unlock, leverage, elevate, craft, unleash, harness.
- **Marketing adjectives**: seamless, robust, powerful, comprehensive, elegant, modern, curated.
- **"Whether you're X or Y"** openers, and rhetorical questions used as section intros.
- **Hype punctuation**: no exclamation marks, no emoji in prose.
- Sentence fragments used for emphasis. Write full sentences.

The tell to check for: if a sentence exists for *rhythm* rather than *information*, cut it.
Read it back and ask what fact the reader gained. If none, it goes.

## Answering in chat

Be short. A few sentences, or a handful of bullets. Long walls of text do not get read, so
detail that is not asked for is wasted, not thorough.

- Lead with the answer. Cut the preamble and the recap of what was just done.
- Report a check as its result (`build ok`), not as a narrated play-by-play.
- Mention a caveat only if it changes what to do next. Skip the rest.
- Expand only when asked, or when a real trap is found.

## Secrets

Never read `.env`, and never print a secret in chat or a tool call. Values reach the code
through `astro:env`, so nothing ever needs to echo them. A secret that lands in the transcript
cannot be unsent: the only fix is rotating it.

## Conventions

- Match the surrounding code. Prettier + ESLint decide formatting; don't hand-format.
- **Do not over-comment.** No docblocks restating what the code says, no narrating the next
  line. Write a comment only for a constraint the code cannot express (a gotcha, a why, a
  non-obvious trade-off), and keep it to one line. Explanations belong in the chat or in
  this file, not scattered through the source.
- Path alias `@/` maps to `src/` (see [tsconfig.json](tsconfig.json)).
- Route-local components live next to their route under `_components/` (e.g.
  [src/pages/posts/[...slug]/_components/](src/pages/posts/%5B...slug%5D/_components/)); shared
  ones go in [src/components/](src/components/).
- Tailwind 4: theme tokens are defined in CSS under [src/styles/](src/styles/), not in a JS config.
