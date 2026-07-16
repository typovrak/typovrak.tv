// Post-build: inject security headers into the Vercel Build Output config.
// Runs after `astro build` (see the build script in package.json).
//
// The CSP script hashes are recomputed from the built HTML every build, so they
// never drift. Inline styles cannot be hashed (Shiki emits a `style` attribute
// per code token), so style-src falls back to 'unsafe-inline' — style injection
// cannot execute script, and script-src stays strict.
//
// CSP ships as Content-Security-Policy-Report-Only: it reports violations
// without blocking, so a bad policy cannot break production. Promote it to the
// enforcing header only after checking the browser console on the home page, an
// article with code blocks, and the search page. Flip ENFORCE_CSP to do so.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(path));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

const ENFORCE_CSP = true;

const CONFIG = ".vercel/output/config.json";
const STATIC_DIR = ".vercel/output/static";

if (!existsSync(CONFIG)) {
  console.log("security-headers: no Vercel output, skipping.");
  process.exit(0);
}

// Collect the hash of every inline, executable <script> across all pages.
// Skips external scripts (src) and non-executed data blocks (ld+json).
const scriptHashes = new Set();
const files = htmlFiles(STATIC_DIR);
const inlineScript =
  /<script(?![^>]*\bsrc=)(?![^>]*type="application\/(ld\+json|json)")[^>]*>([\s\S]*?)<\/script>/g;

for (const file of files) {
  const html = readFileSync(file, "utf8");
  for (const [, , body] of html.matchAll(inlineScript)) {
    if (body.trim() === "") continue;
    const hash = createHash("sha256").update(body, "utf8").digest("base64");
    scriptHashes.add(`'sha256-${hash}'`);
  }
}

// 'wasm-unsafe-eval' lets Pagefind's search WebAssembly compile. It permits
// WASM only, not eval()/new Function(), so script-src stays strict.
const scriptSrc = ["'self'", "'wasm-unsafe-eval'", ...scriptHashes].join(" ");

// The Vercel preview feedback toolbar (vercel.live) is injected on preview
// deployments only, never in production. Allow its sources for preview builds
// so the console stays clean, without loosening the production policy.
const isPreview = process.env.VERCEL_ENV === "preview";
const live = isPreview ? " https://vercel.live" : "";
const liveConnect = isPreview
  ? " https://vercel.live wss://ws-us3.pusher.com https://*.pusher.com"
  : "";

// giscus (comments) loads a script, styles, an iframe and an API from
// giscus.app. Allowing that one trusted origin keeps the policy strict.
const giscus = "https://giscus.app";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `img-src 'self' https: data:`,
  `font-src 'self'${isPreview ? " https://assets.vercel.com" : ""}`,
  `style-src 'self' 'unsafe-inline' ${giscus}`,
  `script-src ${scriptSrc} ${giscus}${live}`,
  `connect-src 'self' https://vitals.vercel-insights.com ${giscus}${liveConnect}`,
  `frame-src ${giscus}${isPreview ? " https://vercel.live" : ""}`,
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const headers = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-DNS-Prefetch-Control": "off",
  [ENFORCE_CSP
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only"]: csp,
};

const config = JSON.parse(readFileSync(CONFIG, "utf8"));
config.routes = config.routes ?? [];
// Apply to every response, then continue to the normal routing.
config.routes.unshift({ src: "/(.*)", headers, continue: true });
writeFileSync(CONFIG, JSON.stringify(config, null, 2));

console.log(
  `security-headers: applied ${scriptHashes.size} script hashes, CSP ${
    ENFORCE_CSP ? "enforced" : "report-only"
  }.`
);
