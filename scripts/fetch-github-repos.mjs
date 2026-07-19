// Fetches star/fork/archived counts for every typovrak/nixos* repo and writes
// them to the JSON the /nixos page reads at build. Run daily by a GitHub
// Action; no runtime API call, no third-party dependency (native fetch).

import { writeFileSync } from "node:fs";

const token = process.env.GH_TOKEN;
const login = process.env.GH_LOGIN ?? "typovrak";
if (!token) {
  console.error("GH_TOKEN is required.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "typovrak.tv-build",
};

const repos = [];
for (let page = 1; ; page++) {
  const response = await fetch(
    `https://api.github.com/users/${login}/repos?per_page=100&page=${page}&type=owner&sort=full_name`,
    { headers }
  );
  if (!response.ok) {
    console.error("GitHub API error:", response.status, await response.text());
    process.exit(1);
  }
  const batch = await response.json();
  repos.push(...batch);
  if (batch.length < 100) break;
}

const data = {};
for (const repo of repos
  .filter(r => r.name.startsWith("nixos"))
  .sort((a, b) => a.name.localeCompare(b.name))) {
  data[repo.name] = {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    archived: repo.archived,
  };
}

// External repos typovrak contributes to, keyed by full name (mirrors the list
// in src/data/contributions.ts).
const external = [
  "freeCodeCamp/freeCodeCamp",
  "Racketlon17/2d-collision-simulator",
];
for (const full of external) {
  const response = await fetch(`https://api.github.com/repos/${full}`, {
    headers,
  });
  if (!response.ok) {
    console.error("GitHub API error:", response.status, await response.text());
    process.exit(1);
  }
  const repo = await response.json();
  data[full] = {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    archived: repo.archived,
  };
}

// Indented so the daily commit produces a readable line-by-line diff. This
// file is excluded from prettier (see .prettierignore).
writeFileSync("src/data/github-repos.json", JSON.stringify(data, null, 2) + "\n");
console.log(`github-repos: ${Object.keys(data).length} repos.`);
