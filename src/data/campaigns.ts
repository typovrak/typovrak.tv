// The `utm_source` values the site accepts, lowercase. A visit arriving with
// anything else is counted with no campaign at all: the value is dropped, never
// stored. See the GDPR section in CLAUDE.md before adding one.
//
// One entry per link published, so two links on the same host stay apart. Never
// add a value that identifies a person or a group small enough to be one.
export const campaigns = [
  "reddit-nixos",
  "reddit-unixporn",
  "reddit-archlinux",
  "hn",
  "lobsters",
  "discord",
  "github-profile",
  "linkedin-post",
  "newsletter",
  "business-card",
] as const;

export type Campaign = (typeof campaigns)[number];
