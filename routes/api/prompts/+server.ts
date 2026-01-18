import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import {
  ModelTarget,
  PromptCategory,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { PromptRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/prompt-repository";
import { db } from "$lib/server/db";

const CreatePromptSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  category: z.enum(Object.values(PromptCategory) as [string, ...string[]]),
  modelTarget: z.enum(Object.values(ModelTarget) as [string, ...string[]]),
  tags: z.array(z.string()).max(10).default([]),
  isFavorite: z.boolean().optional().default(false),
  isPrivate: z.boolean().optional().default(false),
  commitMessage: z.string().optional(),
});

const ListFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  favoriteOnly: z.boolean().optional(),
  includeDeleted: z.boolean().optional(),
});

export const GET: RequestHandler = async ({ locals, url }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const filters = ListFiltersSchema.parse({
    search: url.searchParams.get("search") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    favoriteOnly: url.searchParams.get("favoriteOnly") === "true" ? true : undefined,
    includeDeleted: url.searchParams.get("includeDeleted") === "true" ? true : undefined,
  });

  const repo = new PromptRepository(db);
  const prompts = await repo.listByUserId(userId, filters);
  return json(prompts);
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = CreatePromptSchema.parse(await request.json());
  const repo = new PromptRepository(db);
  const prompt = await repo.create(payload, userId);
  return json(prompt, { status: 201 });
};
