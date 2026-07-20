// A small self-hosted code captcha: a random code drawn into an SVG, plus a
// signed token proving which code was issued. Stateless on purpose, so it needs
// no cookie, no session and no table: the token carries the expiry and an HMAC
// of the code, never the code itself.
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

// No 0/O or 1/I/L: they are indistinguishable once the glyphs are rotated.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const TTL_MS = 10 * 60 * 1000;

export function randomCode(length: number = CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

const sign = (secret: string, code: string, exp: number): string =>
  createHmac("sha256", secret)
    .update(`${code.toUpperCase()}.${exp}`)
    .digest("base64url");

export function issueCaptchaToken(
  code: string,
  secret: string,
  now: number = Date.now()
): string {
  const exp = now + TTL_MS;
  return `${exp}.${sign(secret, code, exp)}`;
}

export function verifyCaptcha(
  token: unknown,
  code: unknown,
  secret: string,
  now: number = Date.now()
): boolean {
  if (typeof token !== "string" || typeof code !== "string") return false;

  const separator = token.indexOf(".");
  if (separator < 1) return false;

  const exp = Number(token.slice(0, separator));
  const signature = token.slice(separator + 1);
  if (!Number.isFinite(exp) || exp < now || !signature) return false;

  const expected = Buffer.from(sign(secret, code.trim(), exp));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// currentColor everywhere, so the image follows the site theme instead of
// hardcoding a palette outside theme.css.
export function captchaSvg(code: string): string {
  const width = 190;
  const height = 60;

  const glyphs = [...code]
    .map((char, i) => {
      const x = 22 + i * 28 + randomInt(-3, 4);
      const y = 42 + randomInt(-6, 7);
      const angle = randomInt(-24, 25);
      return `<text x="${x}" y="${y}" transform="rotate(${angle} ${x} ${y})" font-family="monospace" font-size="30" font-weight="700" fill="currentColor">${char}</text>`;
    })
    .join("");

  const noise = Array.from({ length: 5 }, () => {
    const points = Array.from(
      { length: 4 },
      () => `${randomInt(0, width)},${randomInt(0, height)}`
    ).join(" ");
    return `<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1" opacity="0.35" />`;
  }).join("");

  const dots = Array.from({ length: 24 }, () => {
    return `<circle cx="${randomInt(0, width)}" cy="${randomInt(0, height)}" r="1" fill="currentColor" opacity="0.4" />`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Captcha code" style="max-width:100%;height:auto;">${noise}${dots}${glyphs}</svg>`;
}
