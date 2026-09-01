import type { APIRoute } from "astro";
import { getSql } from "@/utils/db";
import { getKnownPaths } from "@/utils/knownPaths";
import { normalisePath } from "@/utils/paths";
import { isBot } from "@/utils/requestInfo";
import type { QuizResultStats } from "@/utils/quiz";

export const prerender = false;

const isCount = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 50;

// summed rather than averaged in SQL so the arithmetic stays in a unit-tested
// pure function, and so quizzes of different lengths weigh by question
const totalsQuery = (path: string) => {
  const sql = getSql();
  return sql`
    SELECT count(*)::int AS completions,
           coalesce(sum(correct), 0)::int AS sum_correct,
           coalesce(sum(total), 0)::int AS sum_total
    FROM quiz_result
    WHERE path = ${path}
  `;
};

type Row = Record<string, unknown>;

const toStats = (totals: Row[]): QuizResultStats => ({
  completions: Number(totals[0]?.completions ?? 0),
  sumCorrect: Number(totals[0]?.sum_correct ?? 0),
  sumTotal: Number(totals[0]?.sum_total ?? 0),
});

// anonymous final score, one row per completed quiz. per-question answers are
// recorded separately as they are validated (see /api/quiz-answer).
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  const raw = body?.path;
  const path = typeof raw === "string" ? normalisePath(raw) : null;
  if (!path || !(await getKnownPaths()).has(path)) {
    return new Response(null, { status: 404 });
  }

  const correct = body?.correct;
  const total = body?.total;
  if (!isCount(correct) || !isCount(total) || total === 0 || correct > total) {
    return new Response(null, { status: 400 });
  }

  try {
    const sql = getSql();

    if (isBot(request.headers.get("user-agent") ?? "")) {
      const [totals] = await sql.transaction([totalsQuery(path)]);
      return Response.json(toStats(totals));
    }

    const [, totals] = await sql.transaction([
      sql`
        INSERT INTO quiz_result (path, correct, total)
        VALUES (${path}, ${correct}, ${total})
      `,
      totalsQuery(path),
    ]);

    return Response.json(toStats(totals));
  } catch {
    // storage is best-effort; a missing table or DB hiccup never breaks the quiz
    return new Response(null, { status: 503 });
  }
};
