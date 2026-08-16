import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";

// correct = indices into options; the refines below fail the build on a bad quiz
const quizQuestion = z
  .object({
    q: z.string(),
    multiple: z.boolean().default(false),
    options: z.array(z.string()).min(2).max(4),
    correct: z.array(z.number().int().nonnegative()).min(1),
    explain: z.string().optional(),
  })
  .refine(
    question => question.correct.every(i => i < question.options.length),
    {
      message: "quiz: a correct index points past the options",
    }
  )
  .refine(
    question => new Set(question.correct).size === question.correct.length,
    {
      message: "quiz: duplicate correct index",
    }
  )
  .refine(question => question.multiple || question.correct.length === 1, {
    message: "quiz: a single-answer question needs exactly one correct option",
  });

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(config.site.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      timezone: z.string().optional(),
      quiz: z.array(quizQuestion).optional(),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

export const collections = { posts, pages };
