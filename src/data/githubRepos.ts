// Star, fork and archived counts for the repos shown on the site, refreshed
// daily by the GitHub data workflow. Keyed by repo name for owned repos (e.g.
// nixos-nvim) and by full owner/name for external ones (e.g.
// freeCodeCamp/freeCodeCamp).
import repoStats from "./github-repos.json";

export type RepoStats = { stars: number; forks: number; archived: boolean };

const stats: Record<string, RepoStats> = repoStats;

const empty: RepoStats = { stars: 0, forks: 0, archived: false };

export const repoStatsFor = (repo: string): RepoStats => stats[repo] ?? empty;
