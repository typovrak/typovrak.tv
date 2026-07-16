- [ ] unique visitor count with tracability for upgrading the website in the future

- [ ] Content-Security-Policy header. The systemic XSS defence we do not have yet, and the only
      real gap left. Not done now because the theme ships inline scripts (the FOUC guard in
      Layout.astro, the ld+json block), so a useful policy needs per-script hashes recomputed at
      build, or a nonce, which needs SSR. A CSP with `unsafe-inline` would be theatre.

- [ ] legal notice page. Must cover the view tracking and name Vercel Analytics + Speed Insights
      as processors, plus how to object. See the GDPR section in CLAUDE.md.

- [ ] articles commentary section with github account (a plugin for that already exist)

- [ ] article reactions with or without being logged in with github (if not logged in, with hash function)

- [ ] SEO optimization

- [ ] adding all my nixos plugins in this website, with it's own section or article.