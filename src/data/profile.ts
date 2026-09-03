// The prose the home page opens with, and the project it highlights. Kept here
// rather than inline in index.astro so /llms-full.txt can render the same words
// the page shows instead of carrying a second copy that drifts away from it.

export const bio =
  "I'm Morgan Scholz, known as typovrak (typo + Dvorak), a developer writing about Linux and the CLI tools I use daily. I write up what I've had to work out myself: Arch and NixOS setups, terminal configuration, web development, and how the parts of a stack behave once you look closely.";

export type Figure = {
  value: string;
  label: string;
};

export type Project = {
  name: string;
  description: string;
  figures: Figure[];
  repo: string;
  site: string;
};

export const starRune: Project = {
  name: "Star Rune",
  description:
    "A typing game that teaches touch typing and chemistry through combat, for all ages. I build its open-source website, starrune.net, as a volunteer and typing enthusiast supporting the project.",
  figures: [
    { value: "$15,772", label: "raised" },
    { value: "145", label: "backers" },
    { value: "200+", label: "Discord" },
  ],
  repo: "https://github.com/typovrak/star-rune-landing-page",
  site: "https://starrune.net",
};
