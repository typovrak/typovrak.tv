// Post-build: send terminal clients to the text rendering of a page. Runs
// after security-headers.mjs (see the build script in package.json).
//
// `curl typovrak.tv/posts/<slug>` gets the ANSI text the endpoints prerender
// at /posts/<slug>.ansi.txt, and `curl typovrak.tv` the post list. Browsers
// keep the html: the rewrite only fires on a command-line user-agent, and the
// plain /posts/<slug>.txt stays reachable by its own url for anyone piping the
// output into a file. Static files only, so no function is involved.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CONFIG = ".vercel/output/config.json";

if (!existsSync(CONFIG)) {
  console.log("terminal-routes: no Vercel output, skipping.");
  process.exit(0);
}

// The whole header has to match, so the pattern covers the version suffix.
const terminalClient = [
  { type: "header", key: "user-agent", value: "(curl|[Ww]get|HTTPie|xh)/.*" },
];

const routes = [
  { src: "^/$", has: terminalClient, dest: "/index.ansi.txt" },
  // a dot excludes the .txt variants themselves, and posts sit at the root
  // of the collection so a slug never holds a slash
  { src: "^/posts/([^./]+)$", has: terminalClient, dest: "/posts/$1.ansi.txt" },
];

const config = JSON.parse(readFileSync(CONFIG, "utf8"));
config.routes = config.routes ?? [];
// Before the filesystem handler, so the rewritten path is what gets served,
// and after the headers route security-headers.mjs put first.
const filesystem = config.routes.findIndex(route => route.handle === "filesystem");
config.routes.splice(
  filesystem === -1 ? config.routes.length : filesystem,
  0,
  ...routes
);
writeFileSync(CONFIG, JSON.stringify(config, null, 2));

console.log(`terminal-routes: ${routes.length} rewrites for terminal clients.`);
