# Audits

Free tools to audit typovrak.tv. Grouped by concern. Most online scanners need
the **public URL** (`https://typovrak.tv`), not localhost. Tools marked _(local)_
run against a dev build or the codebase; _(extension)_ is a browser add-on;
_(CLI)_ fits this repo's pnpm setup and can go in CI.

Field-data tools (PageSpeed CrUX, Search Console) need real traffic, so they
report "not enough data" until the site has visitors.

## Accessibility

| Tool | URL | Notes |
| --- | --- | --- |
| WAVE | https://wave.webaim.org | Visual report, one page at a time. Best first pass. |
| WebAIM Contrast Checker | https://webaim.org/resources/contrastchecker/ | Verify a token pair. We target AAA (7:1). |
| Lighthouse | Chrome DevTools > Lighthouse | _(local)_ Accessibility category. Also SEO/perf/best-practices. |
| Unlighthouse | https://unlighthouse.dev | _(CLI)_ Crawls every page and runs Lighthouse on all of them. |

Automated tools catch roughly half of WCAG issues. Keyboard-only navigation and
a real screen-reader pass (VoiceOver, NVDA, Orca) catch the rest.

## Performance / Core Web Vitals

| Tool | URL | Notes |
| --- | --- | --- |
| PageSpeed Insights | https://pagespeed.web.dev | Lighthouse lab score + CrUX field data (needs traffic). |
| Lighthouse | Chrome DevTools > Lighthouse | _(local)_ Lab run, no traffic needed. |
| WebPageTest | https://www.webpagetest.org | Waterfall, multiple locations, filmstrip. Deep detail. |
| GTmetrix | https://gtmetrix.com | Free tier, historical monitoring. |
| Unlighthouse | https://unlighthouse.dev | _(CLI)_ Perf across the whole site at once. |

Vercel Speed Insights (already wired in) collects field Core Web Vitals from
real visitors, in the dashboard.

## SEO

| Tool | URL | Notes |
| --- | --- | --- |
| Google Search Console | https://search.google.com/search-console | Indexing, queries, coverage. Needs domain verification. |
| Rich Results Test | https://search.google.com/test/rich-results | Validates the JSON-LD structured data. |
| Schema Markup Validator | https://validator.schema.org | Schema.org validation, not Google-specific. |
| Bing Webmaster Tools | https://www.bing.com/webmasters | Bing's equivalent of Search Console. |
| Lighthouse | Chrome DevTools > Lighthouse | _(local)_ SEO category, basic on-page checks. |

## Privacy / GDPR

Relevant because of the view tracking and Vercel Analytics. See the GDPR section
in [CLAUDE.md](CLAUDE.md).

| Tool | URL | Notes |
| --- | --- | --- |
| Blacklight | https://www.themarkup.org/blacklight | Scans for trackers, cookies, fingerprinting. |
| Webbkoll | https://webbkoll.dataskydd.net | Swedish DPA tool. Cookies, third-party requests, headers. |

Expected result: no cookies, no third-party trackers beyond Vercel. Anything
else is a regression.

## Security headers

| Tool | URL | Notes |
| --- | --- | --- |
| Mozilla Observatory | https://developer.mozilla.org/en-US/observatory | Grades security headers, incl. CSP. |
| Security Headers | https://securityheaders.com | Quick header grade. |

These will flag the missing Content-Security-Policy (see TODO). Expected until
that is added.

## Validation

| Tool | URL | Notes |
| --- | --- | --- |
| Nu HTML Checker | https://validator.w3.org/nu/ | Strict HTML validation. Point it at the deployed URL. |
| W3C CSS Validator | https://jigsaw.w3.org/css-validator/ | Tailwind 4 output may trip warnings on modern syntax. |
