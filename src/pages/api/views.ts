import type { APIRoute } from "astro";
import { getSql } from "@/utils/db";
import { getKnownPaths } from "@/utils/knownPaths";
import { normalisePath } from "@/utils/paths";
import {
  campaignName,
  countryCode,
  deviceClass,
  isBot,
  referrerHost,
} from "@/utils/requestInfo";
import { campaigns } from "@/data/campaigns";

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

// Batch read for listing pages: one query for every preview on the page.
async function readViewsBatch(paths: string[]) {
  const sql = getSql();
  const rows = await sql`
    SELECT path, views FROM page_view WHERE path = ANY(${paths})
  `;
  const counts: Record<string, number> = Object.fromEntries(
    paths.map(p => [p, 0])
  );
  for (const row of rows) counts[String(row.path)] = Number(row.views);
  return counts;
}

// Read-only: viewing a listing is not a view of the articles on it.
export const GET: APIRoute = async ({ url }) => {
  const known = await getKnownPaths();
  const paths = [
    ...new Set(
      url.searchParams
        .getAll("path")
        .slice(0, 100)
        .map(normalisePath)
        .filter((p): p is string => p !== null && known.has(p))
    ),
  ];
  if (paths.length === 0) return new Response(null, { status: 404 });
  return Response.json({ views: await readViewsBatch(paths) });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const path = await resolvePath(body?.path);
  if (!path) return new Response(null, { status: 404 });

  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) {
    return Response.json({ views: await readViews(path) });
  }

  // the tracker reads utm_source client-side: the server never sees it, since
  // the path it posts has already lost the query string
  const campaign = campaignName(
    typeof body?.campaign === "string" ? body.campaign : null,
    campaigns
  );

  const sql = getSql();
  const [, bumped] = await sql.transaction([
    sql`
      INSERT INTO page_view_event (path, referrer_host, country, device, campaign)
      VALUES (
        ${path},
        ${referrerHost(
          request.headers.get("referer"),
          new URL(request.url).hostname
        )},
        ${countryCode(request.headers.get("x-vercel-ip-country"))},
        ${deviceClass(ua)},
        ${campaign}
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
