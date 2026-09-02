import type { APIRoute } from "astro";
import { indexText, text } from "@/pages/_terminal";
import { ansi } from "@/utils/terminal";

export const GET: APIRoute = async () => text(await indexText(ansi));
