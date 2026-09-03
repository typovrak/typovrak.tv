import type { APIRoute } from "astro";
import { getSql } from "@/utils/db";
import { bucketSmall, rankQuestions, withShare } from "@/utils/stats";
import { percentOf } from "@/utils/quiz";

export const prerender = false;

type Row = Record<string, unknown>;

const num = (value: unknown) => Number(value ?? 0);

const buckets = (rows: Row[]) =>
  withShare(
    bucketSmall(
      rows.map(row => ({ name: String(row.name), count: num(row.count) }))
    )
  );

// Read-only, and batched into a single round trip: the HTTP driver sends one
// fetch per query otherwise, which is the whole cost of this route.
export const GET: APIRoute = async () => {
  try {
    const sql = getSql();
    const [totals, pages, referrers, countries, devices, quiz, questions] =
      await sql.transaction([
        sql`
          SELECT (SELECT coalesce(sum(views), 0) FROM page_view)::int AS views,
                 count(*)::int AS events,
                 min(viewed_at) AS since
          FROM page_view_event
        `,
        sql`
          SELECT path, views::int AS views
          FROM page_view
          ORDER BY views DESC, path
          LIMIT 12
        `,
        sql`
          SELECT coalesce(referrer_host, 'direct or unknown') AS name,
                 count(*)::int AS count
          FROM page_view_event
          GROUP BY 1
          ORDER BY 2 DESC, 1
        `,
        sql`
          SELECT coalesce(country, 'unknown') AS name, count(*)::int AS count
          FROM page_view_event
          GROUP BY 1
          ORDER BY 2 DESC, 1
        `,
        sql`
          SELECT coalesce(device, 'unknown') AS name, count(*)::int AS count
          FROM page_view_event
          GROUP BY 1
          ORDER BY 2 DESC, 1
        `,
        sql`
          SELECT count(*)::int AS completions,
                 coalesce(sum(correct), 0)::int AS sum_correct,
                 coalesce(sum(total), 0)::int AS sum_total
          FROM quiz_result
        `,
        sql`
          SELECT path, question,
                 count(*)::int AS attempts,
                 (count(*) FILTER (WHERE NOT correct))::int AS wrong
          FROM quiz_answer
          GROUP BY path, question
          ORDER BY (count(*) FILTER (WHERE NOT correct))::float / count(*) DESC,
                   count(*) DESC
          LIMIT 8
        `,
      ]);

    return Response.json({
      views: num(totals[0]?.views),
      events: num(totals[0]?.events),
      since: totals[0]?.since ?? null,
      pages: pages.map(row => ({
        path: String(row.path),
        views: num(row.views),
      })),
      referrers: buckets(referrers),
      countries: buckets(countries),
      // two or three classes, so no bucket is small enough to hide anyone
      devices: withShare(
        devices.map(row => ({ name: String(row.name), count: num(row.count) }))
      ),
      quiz: {
        completions: num(quiz[0]?.completions),
        averagePercent: percentOf(
          num(quiz[0]?.sum_correct),
          num(quiz[0]?.sum_total)
        ),
        questions: rankQuestions(
          questions.map(row => ({
            path: String(row.path),
            question: num(row.question),
            attempts: num(row.attempts),
            wrong: num(row.wrong),
          }))
        ),
      },
    });
  } catch {
    // the page degrades to a notice; a DB hiccup never breaks it
    return new Response(null, { status: 503 });
  }
};
