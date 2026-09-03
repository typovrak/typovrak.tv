// What we are allowed to derive from a request. See the GDPR section in
// CLAUDE.md: no IP, no raw user-agent, no full referrer URL.

const BOT_UA = /bot|crawl|spider|slurp|preview|headless|monitor|curl|wget/i;

export function isBot(ua: string): boolean {
  return BOT_UA.test(ua);
}

export function deviceClass(ua: string): "mobile" | "tablet" | "desktop" {
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

// Headers are attacker-controlled. Parameterised queries stop injection, but
// these still get stored and read back, so they are validated to a known shape
// rather than trusted.
const HOSTNAME = /^[a-z0-9.-]{1,253}$/i;
const COUNTRY = /^[A-Z]{2}$/;

// Parentheses are impossible in a hostname (see HOSTNAME), so this can never
// collide with a real referrer. Without it, following a link inside the site
// looks exactly like arriving with no referrer at all.
export const INTERNAL = "(internal)";

/**
 * Host only: a full referrer URL carries search terms and private tokens.
 * Returns INTERNAL for a navigation inside the site, and null when there is no
 * usable referrer, which is a direct arrival or a browser that stripped it.
 */
export function referrerHost(
  referer: string | null,
  selfHost: string
): string | null {
  if (!referer) return null;
  try {
    const { hostname } = new URL(referer);
    if (hostname === selfHost) return INTERNAL;
    return HOSTNAME.test(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

/**
 * The `utm_source` of a landing URL, and only if it is one we published.
 *
 * The raw query string is never stored: it carries search terms, session
 * tokens and ad identifiers. A token from a closed list cannot describe the
 * person, so it stays a counter rather than becoming tracking. Anything not on
 * the list is dropped, never stored, exactly like countryCode above.
 */
export function campaignName(
  raw: string | null,
  allowed: readonly string[]
): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  return allowed.includes(value) ? value : null;
}

/** ISO 3166-1 alpha-2, as sent by Vercel. Anything else is discarded. */
export function countryCode(raw: string | null): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return COUNTRY.test(code) ? code : null;
}
