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

/** Host only: a full referrer URL carries search terms and private tokens. */
export function referrerHost(
  referer: string | null,
  selfHost: string
): string | null {
  if (!referer) return null;
  try {
    const { hostname } = new URL(referer);
    if (hostname === selfHost || !HOSTNAME.test(hostname)) return null;
    return hostname;
  } catch {
    return null;
  }
}

/** ISO 3166-1 alpha-2, as sent by Vercel. Anything else is discarded. */
export function countryCode(raw: string | null): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return COUNTRY.test(code) ? code : null;
}
