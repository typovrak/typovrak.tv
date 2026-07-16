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

**URLs never carry a trailing slash.** `trailingSlash: "never"` in [astro.config.ts](astro.config.ts)
makes Astro emit slash-free links, and the Vercel adapter adds a 308 redirect from `/path/` to
`/path`. Keep it that way: do not set `trailingSlash` to anything else, and write internal links
without a trailing slash.

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

Schema lives in [db/schema.sql](db/schema.sql), applied by hand with `psql`. There is no
migration tool, so every statement must stay idempotent.

**Table names are singular**: `page_view`, `page_view_event`. A row is one thing, not a set.

**Normalised by default.** Store facts, derive the rest at query time. Do not add a column that
restates what another table already holds.

**Denormalise only with a reason, and keep it rebuildable.** A cached aggregate is a second
source of truth, so it may only exist when the read cost genuinely justifies it, and it must be
reconstructible from the events in one SQL statement (see the rebuild query at the bottom of
[db/schema.sql](db/schema.sql)). Write it in the same transaction as the event it summarises,
never in a second round-trip. `page_view` is the standing example: `count(*)` over the event log
is O(rows) and would run on every single page load, so the aggregate is worth its cost.

On-demand routes are CSRF-protected by Astro: a POST without a matching `Origin` header gets a
403, so `curl` needs `-H "Origin: ..."` to reach one. This is what stops another site from
POSTing to the view counter.

## Page views

Every page is tracked, not just posts. `PageViewTracker` sits in [Layout.astro](src/layouts/Layout.astro)
and POSTs the current pathname to `/api/views`; any `[data-page-views]` element on the page is
then filled with the returned count, so displaying it costs no second request.

`/api/views` only accepts a path that [knownPaths.ts](src/utils/knownPaths.ts) recognises,
otherwise anyone could POST junk paths and grow the table without bound. That module derives the
valid set: static pages come from `import.meta.glob` (a new page is picked up on its own), and
posts, tag pages and pagination are rebuilt from the collection.

**Those derived paths must match `getStaticPaths` exactly.** They duplicate the route logic, so
they drift the moment a route changes its pagination or slug rules. When touching either side,
verify by diffing against the real build output rather than by reading the code:

```sh
find .vercel/output/static -name '*.html' | sed 's|.vercel/output/static||; s|/index.html$||'
```

`DATABASE_URL` is declared in the `astro:env` schema as `access: "secret", context: "server"`,
so importing it from client code is a build error rather than a leak. It lives in `.env`
locally (gitignored, see [.env.example](.env.example)) and in the Vercel project settings for
deploys. Never paste a connection string into source, chat or a commit.

Note when touching the build: `pnpm build` runs `astro check && astro build`, then indexes the
**deployed** output with `pagefind --site .vercel/output/static`, then
`node scripts/security-headers.mjs`. Pagefind must index `.vercel/output/static` (what Vercel
serves), not `dist`: indexing `dist` and copying into `public/` leaves the index out of the
deployed output on a clean checkout (public/ is already written by then, and `public/pagefind` is
gitignored), so search 404s in production while still working locally.

## Commands

Development runs **in Docker**, not on the host:

```sh
docker compose up        # pnpm dev on http://localhost:4321
```

Everything else via pnpm (inside the container or on the host, but never npm/npx/bun — the repo
is pnpm-only and a stray `package-lock.json` is a mistake, not a fallback):

```sh
pnpm lint          # eslint
pnpm test          # vitest run
pnpm format        # prettier --write
pnpm format:check  # prettier --check (what CI runs)
pnpm build         # astro check + astro build + pagefind
```

## Before proposing a commit

Run all four, and report real results — CI runs exactly these and nothing else:

```sh
pnpm lint && pnpm test && pnpm format:check && pnpm build
```

## Tests

**Vitest**, no end-to-end. Files are `src/**/*.test.ts`, co-located with what they test.

Tests must not need Astro to boot. That is why the fragile logic lives in plain modules
([paths.ts](src/utils/paths.ts), [requestInfo.ts](src/utils/requestInfo.ts)) that import nothing
from `astro:*`, while the modules that do (`knownPaths.ts`, API routes) only wire them together.
Keep new logic on the testable side of that line rather than reaching for `getViteConfig` and
mocking the content layer.

Write the test so it can fail. After writing one, break the implementation and check it goes
red — a test that passes against broken code is worse than no test, because it grants
confidence it has not earned.

What is worth covering: pagination maths, path normalisation, and the GDPR guarantees (referrer
reduced to a host, user-agent reduced to a device class). What unit tests **cannot** catch here
is `knownPaths.ts` drifting from `getStaticPaths` — only the build diff shows that.

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

## GDPR

**Hard requirement.** typovrak is in France, so the CNIL is the regulator. When a feature could
collect anything about a visitor, minimisation wins over usefulness. If a field is not needed
for a question actually being asked, it is not collected. None of this is legal advice; the
rules below are the engineering floor, not a compliance sign-off.

The site sets **no cookie and no localStorage** for analytics, and must stay that way. That is
what keeps ePrivacy art. 5(3) out of scope: consent is only required to read or write on the
visitor's device. A server-side counter touches nothing, so no consent banner. Introducing any
client-side identifier (cookie, localStorage id, fingerprint) reopens this and forces a banner.

Never store, whatever the temptation:

- **IP address**, even hashed. Pseudonymised data is still personal data (GDPR recital 26). The
  CNIL requires truncating at least the last byte if an IP is kept at all. We do not need one.
- **Full user-agent string.** It is a fingerprinting vector. Coarse derivations (`mobile` vs
  `desktop`) are fine; the raw string is not.
- **Full referrer URL.** Query strings carry search terms and private tokens. Keep the host only.
- Any stable per-visitor identifier, which would turn a counter into tracking.

Safe to store: post slug, timestamp, referrer host, country (`x-vercel-ip-country` is coarse
enough), and a coarse device class.

Also required:

- **Retention.** The CNIL caps audience-measurement data at 25 months. Purging is manual, run by
  hand with the query in [db/schema.sql](db/schema.sql). Nothing deletes data automatically.
- **Purpose limitation.** Audience measurement only. Do not cross-reference these rows with
  anything else, and do not pass them to a third party.
- **Information and objection.** The privacy page must say what is collected and how to object.

`@vercel/analytics` and `@vercel/speed-insights` are cookieless but are still a processor
handling visitor data, so they belong in the privacy page.

## Security

**SQL injection.** Every query is a tagged template, which parameterises interpolated values.
Never build SQL by concatenation, and never use `sql.unsafe()` on anything that reached us from
a request. `sql.query("... WHERE x = $1", [v])` is the form for a query built at runtime.

**XSS.** Astro escapes `{expr}` in both text and attribute position, including quotes, so
content cannot break out on its own. The hole is `set:html`, which bypasses that. There is one
use of it, for the JSON-LD block, and it goes through
[serialiseJsonLd](src/utils/jsonLd.ts): `JSON.stringify` does not escape `<`, so a post title
containing `</script>` would otherwise close the tag and inject markup. Do not add another
`set:html` without a reason, and never with a value that came from a request.

**Request headers are attacker-controlled**, including the `x-vercel-*` ones when a request does
not come through Vercel's edge. Validate them to a known shape before storing rather than
trusting them: see `countryCode` and `referrerHost` in [requestInfo.ts](src/utils/requestInfo.ts).
Parameterised queries stop injection, but they do not stop garbage being stored and read back.

**Do not grep the built HTML for a payload to check for XSS.** It gives false positives: a
payload sitting inside a quoted attribute or already escaped to `&quot;` still matches. Read the
rendered tag instead.

**Security headers and CSP** are injected into the Vercel Build Output config after the build by
[scripts/security-headers.mjs](scripts/security-headers.mjs) (wired into `pnpm build`). It
recomputes the `script-src` hashes from the built HTML every build, so they never drift by hand.
Astro's native CSP is not usable here (no Shiki support: it emits an inline `style` per code
token). `style-src` therefore keeps `'unsafe-inline'` (style injection cannot execute script);
`script-src` stays strict and **enforced**, `'self'` plus per-script hashes, no `'unsafe-inline'`.
It also carries `'wasm-unsafe-eval'`, which Pagefind's search WebAssembly needs to compile; that
token permits WASM only, never `eval()`, so the policy stays strict.

**Do not re-add Astro's `<ClientRouter />` / view transitions.** It injects a
`data:application/javascript` probe script on every navigation, which strict `script-src` blocks.
It was removed so the CSP could be enforced. Because there is no client-side router, every
navigation is a full page load, so page scripts must run on load directly (call the init
immediately), not from `astro:page-load` / `astro:after-swap`, which no longer fire.

The Vercel preview feedback toolbar (`vercel.live`, Pusher websockets) is injected on preview
deployments only, never in production. The script allows its sources when `VERCEL_ENV=preview`,
so the preview console stays clean without loosening the production policy.

The other headers (HSTS, nosniff, frame-ancestors via X-Frame-Options, Referrer-Policy,
Permissions-Policy, COOP) are enforced and safe. If a CSP change is ever risky, flip
`ENFORCE_CSP` to `false` in the script to ship it report-only first and check the browser
console before enforcing.

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
