import type { APIRoute } from "astro";
import { postText, terminalPaths, text } from "@/pages/_terminal";
import { ansi } from "@/utils/terminal";

export const getStaticPaths = terminalPaths;

export const GET: APIRoute = async ({ props }) =>
  text(await postText(props.post, ansi));
