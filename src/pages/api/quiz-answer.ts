import type { APIRoute } from "astro";
import { getSql } from "@/utils/db";
import { getKnownPaths } from "@/utils/knownPaths";
import { normalisePath } from "@/utils/paths";
import { isBot } from "@/utils/requestInfo";
import type { QuizAnswerStats } from "@/utils/quiz";

export const prerender = false;

const isCount = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 50;

const totalsQuery = (path: string, question: number) => {
  const sql = getSql();
  return sql`
    SELECT count(*)::int AS answers,
           (count(*) FILTER (WHERE correct))::int AS correct
    FROM quiz_answer
    WHERE path = ${path} AND question = ${question}
  `;
};

// picked holds comma-joined option indices, so a multi-select answer is counted
// once per option it names
const picksQuery = (path: string, question: number) => {
  const sql = getSql();
  return sql`
    SELECT opt, count(*)::int AS picks
    FROM quiz_answer, unnest(string_to_array(picked, ',')) AS opt
    WHERE path = ${path} AND question = ${question}
    GROUP BY opt
  `;
};

type Row = Record<string, unknown>;

const toStats = (totals: Row[], picks: Row[]): QuizAnswerStats => ({
  answers: Number(totals[0]?.answers ?? 0),
  correct: Number(totals[0]?.correct ?? 0),
  picks: Object.fromEntries(
    picks
      .filter(row => /^\d+$/.test(String(row.opt)))
      .map(row => [String(row.opt), Number(row.picks)])
  ),
});

// anonymous: one row per answered question, recorded as each is validated so
// answers survive even when the quiz is left unfinished. no identifier.
// the reply carries the aggregate for that question, so showing it costs no
// second request. insert and read share one transaction, otherwise a
// concurrent answer could return a count that omits the row just written.
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  const raw = body?.path;
  const path = typeof raw === "string" ? normalisePath(raw) : null;
  if (!path || !(await getKnownPaths()).has(path)) {
    return new Response(null, { status: 404 });
  }

  const question = body?.question;
  const picked = body?.picked;
  const correct = body?.correct;
  if (
    !isCount(question) ||
    typeof correct !== "boolean" ||
    !Array.isArray(picked) ||
    !picked.every(isCount)
  ) {
    return new Response(null, { status: 400 });
  }

  try {
    const sql = getSql();

    if (isBot(request.headers.get("user-agent") ?? "")) {
      const [totals, picks] = await sql.transaction([
        totalsQuery(path, question),
        picksQuery(path, question),
      ]);
      return Response.json(toStats(totals, picks));
    }

    const [, totals, picks] = await sql.transaction([
      sql`
        INSERT INTO quiz_answer (path, question, picked, correct)
        VALUES (${path}, ${question}, ${picked.join(",")}, ${correct})
      `,
      totalsQuery(path, question),
      picksQuery(path, question),
    ]);

    return Response.json(toStats(totals, picks));
  } catch {
    // storage is best-effort; a missing table or DB hiccup never breaks the quiz
    return new Response(null, { status: 503 });
  }
};
