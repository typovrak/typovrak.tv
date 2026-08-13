// One identity, declared once and referenced everywhere by a stable @id, so a
// search engine or an LLM resolves every page to the same author and site
// rather than a fresh anonymous node per page. Each page ships the full Person
// and WebSite nodes plus the page-specific node, so a crawler that only sees a
// single page still resolves the identity.
import config from "@/config";

const { site } = config;
const base = site.url.replace(/\/$/, "");
const home = `${base}/`;

export const personId = `${base}/#person`;
export const websiteId = `${base}/#website`;

// sameAs proves the entity is real by pointing at other profiles that are the
// same person. Only genuine identity profiles belong here, never share links.
const sameAs = site.profile ? [site.profile] : undefined;

export const personNode = {
  "@type": "Person",
  "@id": personId,
  name: site.author,
  // Ties the pseudonym to the real name, which the legal notices already
  // expose, so the entity reads as a real person.
  alternateName: "Morgan Scholz",
  url: home,
  ...(sameAs && { sameAs }),
};

export const websiteNode = {
  "@type": "WebSite",
  "@id": websiteId,
  url: home,
  name: site.title,
  description: site.description,
  inLanguage: site.lang,
  publisher: { "@id": personId },
  // Lets Google offer a sitelinks search box; the target reads ?q= on the
  // Pagefind search page.
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${home}search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const personRef = { "@id": personId };
export const websiteRef = { "@id": websiteId };
