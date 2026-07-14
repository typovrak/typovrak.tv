import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "astro:env/server";

let client: ReturnType<typeof neon> | undefined;

// HTTP driver: one-shot queries, no session. Swap to Pool for interactive transactions.
export function getSql() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is unset. See .env.example");
  }
  client ??= neon(DATABASE_URL);
  return client;
}
