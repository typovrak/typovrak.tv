- [ ] adding all my nixos plugins in this website, with it's own section or article.

- [x] display my github wall -> a daily GitHub Action fetches the contribution calendar into
      src/data/github-contributions.json (commit-if-changed), and GithubWall.astro renders it at
      build as a grid of divs (theme-aware via --accent/--muted), clickable to the profile. No
      runtime API call, no third party, CSP/GDPR clean. Animation dropped for now; the divs make
      it a trivial CSS add later. To count PRIVATE contributions, set a CONTRIB_TOKEN (read:user
      PAT) repo secret; without it the Action uses GITHUB_TOKEN (public contributions only).

- [ ] mettre en place une partie dactylographie sur le site

AFTER THE FIRST POST IS DONE :
- [ ] Google site verification + bing

- [ ] add components like AWS does it in every article to make it more enjoyable
- [ ] add at the end, before the comment section, a Q&A for every article with a result (like AWS)