- [x] Content-Security-Policy, enforced. scripts/security-headers.mjs recomputes script hashes
      from the built HTML each build. Removed Astro's ClientRouter (its data: probe tripped
      script-src), so view transitions are gone and navigation is full page loads. style-src
      keeps unsafe-inline (Shiki per-token styles); script-src is strict, enforced. Also fixed a
      pagefind bug (search 404 in prod) uncovered while testing: pagefind now indexes the deployed
      .vercel/output/static, not dist.

- [~] legal notice page -> /legal-notices, linked in the footer. Covers editor, hosting (Vercel,
      Neon), the view tracking, Vercel Analytics + Speed Insights as processors, no-cookie stance,
      EU transfers, rights and objection, CNIL. Fill in the bracketed line (business status/SIRET)
      if publishing as a registered business, and have someone review it. Not legal advice.

- [ ] articles commentary section with github account (a plugin for that already exist)

- [ ] article reactions with or without being logged in with github (if not logged in, with hash function)

- [ ] SEO optimization

- [ ] adding all my nixos plugins in this website, with it's own section or article.

- [ ] mettre codecov et autres intégrations de ce type gratuite pour apprendre et découvrir 

- [ ] remove useless packages like slugify that can be made myself

- [ ] mettre des composants comme sur les cours AWS pour varier la lecture
  
- [ ] mettre en place une partie dactylographie sur le site