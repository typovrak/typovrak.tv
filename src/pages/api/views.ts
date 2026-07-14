import type { APIRoute } from "astro";
import { getSql } from "@/utils/db";
import { getKnownPaths } from "@/utils/knownPaths";
import { normalisePath } from "@/utils/paths";
import {
  countryCode,
  deviceClass,
  isBot,
  referrerHost,
} from "@/utils/requestInfo";

export const prerender = false;

async function resolvePath(raw: unknown): Promise<string | null> {
  if (typeof raw !== "string") return null;
  const path = normalisePath(raw);
  if (!path) return null;
  return (await getKnownPaths()).has(path) ? path : null;
}

async function readViews(path: string) {
  const sql = getSql();
  const rows = await sql`SELECT views FROM page_view WHERE path = ${path}`;
  return Number(rows[0]?.views ?? 0);
}

export const GET: APIRoute = async ({ url }) => {
  const path = await resolvePath(url.searchParams.get("path"));
  if (!path) return new Response(null, { status: 404 });
  return Response.json({ views: await readViews(path) });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const path = await resolvePath(body?.path);
  if (!path) return new Response(null, { status: 404 });

  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) {
    return Response.json({ views: await readViews(path) });
  }

  const sql = getSql();
  const [, bumped] = await sql.transaction([
    sql`
      INSERT INTO page_view_event (path, referrer_host, country, device)
      VALUES (
        ${path},
        ${referrerHost(
          request.headers.get("referer"),
          new URL(request.url).hostname
        )},
        ${countryCode(request.headers.get("x-vercel-ip-country"))},
        ${deviceClass(ua)}
      )
    `,
    sql`
      INSERT INTO page_view (path, views) VALUES (${path}, 1)
      ON CONFLICT (path) DO UPDATE SET views = page_view.views + 1
      RETURNING views
    `,
  ]);

  return Response.json({ views: Number(bumped[0].views) });
};
