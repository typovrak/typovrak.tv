import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { DATABASE_URL } from "astro:env/server";

let client: NeonQueryFunction<false, false> | undefined;

// HTTP driver: one-shot queries, no session. Swap to Pool for interactive transactions.
export function getSql(): NeonQueryFunction<false, false> {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is unset. See .env.example");
  }
  client ??= neon(DATABASE_URL);
  return client;
}
