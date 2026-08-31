Adding some code for french translation... (only an example here)

# typovrak.tv

[![CI](https://github.com/typovrak/typovrak.tv/actions/workflows/ci.yml/badge.svg)](https://github.com/typovrak/typovrak.tv/actions/workflows/ci.yml)
[![CodeQL](https://github.com/typovrak/typovrak.tv/actions/workflows/codeql.yml/badge.svg)](https://github.com/typovrak/typovrak.tv/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/typovrak/typovrak.tv/branch/main/graph/badge.svg)](https://codecov.io/gh/typovrak/typovrak.tv)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/typovrak/typovrak.tv/badge)](https://securityscorecards.dev/viewer/?uri=github.com/typovrak/typovrak.tv)

Source of [typovrak.tv](https://typovrak.tv), my developer blog. Notes on Linux, CLI tooling and web development.

Built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com) and [Pagefind](https://pagefind.app), on top of the [AstroPaper](https://github.com/satnaing/astro-paper) theme by Sat Naing.

## Development

Requires Docker. Dev runs in a container:

```sh
docker compose up   # http://localhost:4321
```

Everything else uses pnpm. This repo is pnpm-only, so don't use npm or bun:

```sh
pnpm lint          # eslint
pnpm format        # prettier --write
pnpm format:check  # prettier --check
pnpm build         # astro check + astro build + pagefind index
```

`pnpm lint && pnpm format:check && pnpm build` is exactly what CI runs.

## Writing a post

Drop a `.md` or `.mdx` file in `src/content/posts/`. Frontmatter is validated by the Zod schema in [`src/content.config.ts`](src/content.config.ts), which requires `title`, `description` and `pubDatetime`.

Files whose name starts with `_` are excluded from the collection. `_adding-new-post.mdx` and `_markdown-syntax.md` are kept as unpublished references for the frontmatter rules and markdown rendering.

## Theme

Colors are [Catppuccin](https://catppuccin.com) Mocha with a green accent. The site is dark only, with no light mode and no theme toggle. All seven design tokens live in [`src/styles/theme.css`](src/styles/theme.css) and nothing is hardcoded elsewhere. Contrast meets WCAG AAA.

## License

[MIT](LICENSE). The theme is MIT by Sat Naing. Post content is mine.
