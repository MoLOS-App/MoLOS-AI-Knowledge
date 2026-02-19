import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { PromptRepository } from "$lib/server/external_modules/MoLOS-AI-Knowledge/repositories/prompt-repository";
import { db } from "$lib/server/db";

const CreatePromptSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  tags: z.array(z.string()).max(10).default([]),
  commitMessage: z.string().optional(),
});

const ListFiltersSchema = z.object({
  search: z.string().optional(),
  tag: z.string().optional(),
  includeDeleted: z.boolean().optional(),
});

const UpdatePromptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isDeleted: z.boolean().optional(),
  commitMessage: z.string().optional(),
});

export const GET: RequestHandler = async ({ locals, url }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const filters = ListFiltersSchema.parse({
    search: url.searchParams.get("search") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    includeDeleted: url.searchParams.get("includeDeleted") === "true" ? true : undefined,
  });

  const repo = new PromptRepository(db);
  const prompts = await repo.listByUserId(userId, filters);
  return json(prompts);
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  console.log("[MoLOS-AI-Knowledge][prompts][POST] userId", userId ?? "none");
  if (!userId) throw error(401, "Unauthorized");

  const payload = CreatePromptSchema.parse(await request.json());
  const repo = new PromptRepository(db);
  const prompt = await repo.create(payload, userId);
  console.log("[MoLOS-AI-Knowledge][prompts][POST] created", prompt.id);
  return json(prompt, { status: 201 });
};

export const PUT: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = UpdatePromptSchema.parse(await request.json());
  const { id, ...updates } = payload;
  const repo = new PromptRepository(db);
  const prompt = await repo.update(id, userId, updates);
  if (!prompt) throw error(404, "Prompt not found");
  return json(prompt);
};
