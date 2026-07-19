import type { APIRoute } from "astro";
import { getSql } from "@/utils/db";
import { DISCORD_WEBHOOK_URL } from "astro:env/server";

export const prerender = false;

const MAX = { module: 100, details: 2000, email: 200 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body) return new Response(null, { status: 400 });

  // Honeypot: bots fill hidden fields. Pretend success and store nothing.
  if (typeof body.website === "string" && body.website.length > 0) {
    return Response.json({ ok: true });
  }

  const module = clean(body.module, MAX.module);
  const details = clean(body.details, MAX.details);
  const email = clean(body.email, MAX.email);
  const consent = body.consent === true;

  // Consent is the legal basis, so it is mandatory. Email lets the publisher
  // reply. Details are required so a request always carries some context.
  if (!module || !details || !EMAIL.test(email) || !consent) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const sql = getSql();
  await sql`
    INSERT INTO module_request (module, details, email)
    VALUES (${module}, ${details}, ${email})
  `;

  // Best-effort Discord notification; a webhook failure must not fail the
  // request. allowed_mentions is emptied so submitted text cannot ping anyone.
  if (DISCORD_WEBHOOK_URL) {
    const content = [
      "**New NixOS module request**",
      `Module: ${module}`,
      details ? `Details: ${details}` : null,
      `Email: ${email}`,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 1900);
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
    }).catch(() => {});
  }

  return Response.json({ ok: true });
};
