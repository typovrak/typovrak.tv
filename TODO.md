- [x] create a CLAUDE.md
- [x] cleanup everything that is not needed
- [x] use the catppuccin mocha green theme

- [x] vercel auto-deployment
- [x] enable vercel features like RGPD like tracking and core web vitals
- [x] replace the current favicon by typovrak's logo

- [x] create a neon database for this project
- [x] create .env and .env.example with all needed credentials

- [ ] view count par article
- [ ] view count per pages
- [ ] unique visitor count with tracability for upgrading the website in the future

- [ ] separate dev data from prod: create a `dev` branch in the Neon console, point the local
      `.env` at it, keep `main` for the Vercel env vars. Nothing to change in the code, and no
      local Postgres: the HTTP driver speaks Neon's own protocol over HTTPS, not the Postgres
      wire protocol, so a local instance would need Neon's wsproxy container *and* a switch to
      `Pool` — dev would then run a different driver than prod. Free tier allows 10 branches.
      The Vercel/Neon integration can also branch per preview deploy. Tests need no database:
      they are pure unit tests.

- [ ] tests: postFilter. The only guard against publishing a draft or a scheduled post early.
      Date-dependent, and its `import.meta.env.DEV` branch inverts the behaviour between dev and
      prod, so the case that matters is the one never seen locally. Needs fake timers around
      `scheduledPostMargin`, and a stub for `astro:env/client` (its import chain goes through
      `@/config`).
- [ ] tests: slugify. Decides tag URLs permanently, and switches between `slugify` and
      `lodash.kebabcase` on a `hasNonLatin` regex. `knownPaths` uses `slugifyAll` to validate tag
      paths, so a change there breaks both the URLs and the view tracking. No Astro imports, so
      no setup needed.
- [ ] tests: getPostSlug. Builds post URLs, which never change once published, and `knownPaths`
      depends on it. Extract the pure part first: it sits in a module importing `astro:i18n`
      that it does not need, same split as `paths.ts`.
- [ ] tests: getUniqueTags (dedup collapses case, so Docker and docker merge into one tag), then
      archives grouping. Lower value.
      Not worth testing: withBase (i18n off, base is `/`), toTransitionName, getFontPathByWeight.

- [ ] Content-Security-Policy header. The systemic XSS defence we do not have yet, and the only
      real gap left. Not done now because the theme ships inline scripts (the FOUC guard in
      Layout.astro, the ld+json block), so a useful policy needs per-script hashes recomputed at
      build, or a nonce, which needs SSR. A CSP with `unsafe-inline` would be theatre.
- [ ] legal notice page. Must cover the view tracking and name Vercel Analytics + Speed Insights
      as processors, plus how to object. See the GDPR section in CLAUDE.md.
- [ ] purge page_view_event older than 25 months (CNIL cap). Query is in db/schema.sql.
- [ ] accessibility optimization

- [ ] accessibility audit
- [ ] performance audit

- [ ] articles commentary section with github account (a plugin for that already exist)
- [ ] article reactions with or without being logged in with github (if not logged in, with hash function)

- [ ] SEO optimization
- [ ] adding all my nixos plugins in this website, with it's own section or article.