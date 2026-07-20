import type { APIRoute } from "astro";
import { getSql } from "@/utils/db";
import { buildModuleRequestEmail } from "@/utils/moduleRequestEmail";
import { BREVO_API_KEY, DISCORD_WEBHOOK_URL } from "astro:env/server";
import config from "@/config";

export const prerender = false;

// Sender must be on a domain authenticated in Brevo.
const SENDER = { name: "typovrak", email: "noreply@typovrak.tv" };

// A reachable reply address; a no-reply sender with nowhere to answer scores
// worse with spam filters.
const REPLY_TO = "typovrak@gmail.com";

// The confirmation email goes to an address the submitter types, so cap how
// many a single address can trigger per day.
const MAX_PER_DAY = 3;

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

  const recent = await sql`
    SELECT count(*)::int AS count FROM module_request
    WHERE email = ${email} AND created_at > now() - interval '1 day'
  `;
  if (Number(recent[0]?.count ?? 0) >= MAX_PER_DAY) {
    return Response.json({ error: "too_many" }, { status: 429 });
  }

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

  // Best-effort confirmation to the requester; a mail failure must not fail the
  // request, which is already stored.
  if (BREVO_API_KEY) {
    const message = buildModuleRequestEmail({
      module,
      details,
      siteUrl: config.site.url,
    });
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email }],
        replyTo: { email: REPLY_TO },
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
    }).catch(() => {});
  }

  return Response.json({ ok: true });
};
