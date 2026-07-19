// Open-source projects typovrak contributes to, beyond his own repos. The repo
// field is the key used in githubRepos for the star/fork counts, so it must
// match an entry the fetch-github-repos script pulls (see its external list).
export type Contribution = {
  repo: string;
  url: string;
  description: string;
  // The project is no longer maintained (not a GitHub archive, a manual note).
  inactive?: boolean;
};

export const contributions: Contribution[] = [
  {
    repo: "freeCodeCamp/freeCodeCamp",
    url: "https://github.com/freeCodeCamp/freeCodeCamp",
    description: "Open-source codebase and curriculum for learning to code.",
  },
  {
    repo: "Racketlon17/2d-collision-simulator",
    url: "https://github.com/Racketlon17/2d-collision-simulator",
    description: "A JavaScript simulator for elastic and inelastic collisions.",
    inactive: true,
  },
];
