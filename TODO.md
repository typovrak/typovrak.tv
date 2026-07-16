- [~] legal notice page -> /legal-notices, linked in the footer. Covers editor, hosting (Vercel,
      Neon), the view tracking, Vercel Analytics + Speed Insights as processors, no-cookie stance,
      EU transfers, rights and objection, CNIL. Fill in the bracketed line (business status/SIRET)
      if publishing as a registered business, and have someone review it. Not legal advice.

- [~] articles commentary section with github account -> giscus (GitHub Discussions), on posts
      only, click-to-load for privacy, Catppuccin theme synced to light/dark, CSP allows
      giscus.app, legal notices updated. To activate: enable Discussions on the repo, install the
      giscus app (github.com/apps/giscus), then fill repoId and categoryId in astro-paper.config.ts
      from giscus.app. Comments stay hidden until both are set. Chose giscus over a hand-built
      system for now (OAuth + image/upload + moderation are too much until the blog has traffic).

- [ ] article reactions with or without being logged in with github (if not logged in, with hash function)

- [ ] SEO optimization

- [ ] adding all my nixos plugins in this website, with it's own section or article.

- [ ] mettre codecov et autres intégrations de ce type gratuite pour apprendre et découvrir 

- [ ] mettre des composants comme sur les cours AWS pour varier la lecture
  
- [ ] mettre en place une partie dactylographie sur le site