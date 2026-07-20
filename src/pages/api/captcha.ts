import type { APIRoute } from "astro";
import { captchaSvg, issueCaptchaToken, randomCode } from "@/utils/captcha";
import { CAPTCHA_SECRET } from "astro:env/server";

export const prerender = false;

// Issues a code image plus the token that proves which code it was. The code
// itself never leaves the server in readable form.
export const GET: APIRoute = async () => {
  if (!CAPTCHA_SECRET) {
    console.error("captcha: CAPTCHA_SECRET is unset, cannot issue a challenge");
    return new Response(null, { status: 503 });
  }

  const code = randomCode();

  return Response.json(
    { token: issueCaptchaToken(code, CAPTCHA_SECRET), svg: captchaSvg(code) },
    { headers: { "cache-control": "no-store" } }
  );
};
