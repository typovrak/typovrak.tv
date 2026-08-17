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

// anonymous: one row per answered question, recorded as each is validated so
// answers survive even when the quiz is left unfinished. no identifier.
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

  if (isBot(request.headers.get("user-agent") ?? "")) {
    return new Response(null, { status: 204 });
  }

  try {
    const sql = getSql();
    await sql`
      INSERT INTO quiz_answer (path, question, picked, correct)
      VALUES (${path}, ${question}, ${picked.join(",")}, ${correct})
    `;
  } catch {
    // storage is best-effort; a missing table or DB hiccup never breaks the quiz
    return new Response(null, { status: 503 });
  }

  return new Response(null, { status: 204 });
};
