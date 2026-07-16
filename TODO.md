- [~] Content-Security-Policy. Done as report-only via scripts/security-headers.mjs, which
      recomputes script hashes from the built HTML each build (Astro native CSP was unusable:
      Shiki + ClientRouter). style-src keeps unsafe-inline (Shiki per-token styles); script-src
      is strict. Remaining: load the deployed site in a browser, confirm the console is clean on
      home / an article with code / search, then set ENFORCE_CSP = true to enforce.

- [~] legal notice page -> /legal-notices, linked in the footer. Covers editor, hosting (Vercel,
      Neon), the view tracking, Vercel Analytics + Speed Insights as processors, no-cookie stance,
      EU transfers, rights and objection, CNIL. Fill in the bracketed line (business status/SIRET)
      if publishing as a registered business, and have someone review it. Not legal advice.

- [ ] articles commentary section with github account (a plugin for that already exist)

- [ ] article reactions with or without being logged in with github (if not logged in, with hash function)

- [ ] SEO optimization

- [ ] adding all my nixos plugins in this website, with it's own section or article.

- [ ] mettre codecov et autres intégrations de ce type gratuite pour apprendre et découvrir 