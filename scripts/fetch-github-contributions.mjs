// Fetches the GitHub contribution calendar and writes it to the JSON the
// GithubWall component reads at build. Run daily by a GitHub Action; no runtime
// API call, no third-party dependency (native fetch).

import { writeFileSync } from "node:fs";

const token = process.env.GH_TOKEN;
const login = process.env.GH_LOGIN ?? "typovrak";
if (!token) {
  console.error("GH_TOKEN is required.");
  process.exit(1);
}

const query = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount contributionLevel }
          }
        }
      }
    }
  }`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "typovrak.tv-build",
  },
  body: JSON.stringify({ query, variables: { login } }),
});

const body = await response.json();
if (!response.ok || body.errors) {
  console.error("GraphQL error:", JSON.stringify(body.errors ?? body));
  process.exit(1);
}

const levels = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};
const calendar =
  body.data.user.contributionsCollection.contributionCalendar;
const data = {
  total: calendar.totalContributions,
  weeks: calendar.weeks.map(week => ({
    days: week.contributionDays.map(day => ({
      date: day.date,
      count: day.contributionCount,
      level: levels[day.contributionLevel],
    })),
  })),
};

// Indented so the daily commit produces a readable line-by-line diff. This
// file is excluded from prettier (see .prettierignore).
writeFileSync(
  "src/data/github-contributions.json",
  JSON.stringify(data, null, 2) + "\n"
);
console.log(
  `github-contributions: ${data.total} contributions, ${data.weeks.length} weeks.`
);
