// The pages of the site as llms.txt documents, rendered from the same data the
// pages themselves use so the two can never drift. Underscore-prefixed so Astro
// never routes it.
import { renderGroups, type LlmsDocument } from "@/utils/llms";
import {
  moduleCount,
  moduleNixos,
  moduleUrl,
  nixosCategories,
  nixosCoreDescription,
  nixosIntro,
  nixosRepoUrl,
  nixosVersion,
  totalForks,
  totalStars,
} from "@/data/nixos";
import { contributions } from "@/data/contributions";
import { bio, starRune } from "@/data/profile";
import { useTranslations } from "@/i18n";
import config from "@/config";

const site = config.site.url.replace(/\/$/, "");

const figures = (project: typeof starRune) =>
  project.figures.map(figure => `${figure.value} ${figure.label}`).join(", ");

export const sitePages = (): LlmsDocument[] => [
  {
    title: useTranslations(config.site.lang).nav.home,
    url: `${site}/`,
    description: config.site.description,
    body: [
      bio,
      "",
      `Contact and profiles: ${config.socials.map(social => social.url).join(", ")}.`,
      "",
      `Every post is also served as markdown at its url with a .txt suffix, and a command-line client asking for a page gets the text rendering instead of the HTML.`,
    ].join("\n"),
  },
  {
    title: starRune.name,
    url: `${site}/#star-rune`,
    description: "The open-source project I volunteer on.",
    body: [
      starRune.description,
      "",
      `Figures: ${figures(starRune)}.`,
      `Website: ${starRune.site}`,
      `Source of the site I build: ${starRune.repo}`,
    ].join("\n"),
  },
  {
    title: "Open source contributions",
    url: `${site}/#contributions`,
    description: "Projects I contribute to beyond my own.",
    body: contributions
      .map(
        item =>
          `- [${item.repo}](${item.url}): ${item.description}${item.inactive ? " No longer maintained." : ""}`
      )
      .join("\n"),
  },
  {
    title: "NixOS config",
    url: `${site}/nixos`,
    description: "My NixOS configuration, split into one module per tool.",
    body: [
      nixosIntro,
      "",
      `${moduleCount} modules, ${totalStars} stars and ${totalForks} forks across the umbrella repo and every module. Each targets NixOS ${nixosVersion} unless the module says otherwise.`,
      "",
      `Core config: ${nixosRepoUrl}. ${nixosCoreDescription}`,
      "",
      `Every module lives at ${moduleUrl("<name>")}.`,
      "",
      renderGroups(
        nixosCategories.map(category => ({
          name: category.title,
          items: category.modules.map(module => ({
            name: module.name,
            // only the exceptions carry a version, the rest follow nixosVersion
            note:
              moduleNixos(module) === nixosVersion
                ? module.purpose
                : `${module.purpose} (NixOS ${moduleNixos(module)})`,
          })),
        }))
      ),
    ].join("\n"),
  },
];
