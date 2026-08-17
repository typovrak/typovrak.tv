import type { APIRoute } from "astro";
import { getSql } from "@/utils/db";
import { getKnownPaths } from "@/utils/knownPaths";
import { normalisePath } from "@/utils/paths";
import { isBot } from "@/utils/requestInfo";

export const prerender = false;

const isCount = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 50;

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

  if (isBot(request.headers.get("user-agent") ?? "")) {
    return new Response(null, { status: 204 });
  }

  try {
    const sql = getSql();
    await sql`
      INSERT INTO quiz_result (path, correct, total)
      VALUES (${path}, ${correct}, ${total})
    `;
  } catch {
    // storage is best-effort; a missing table or DB hiccup never breaks the quiz
    return new Response(null, { status: 503 });
  }

  return new Response(null, { status: 204 });
};
