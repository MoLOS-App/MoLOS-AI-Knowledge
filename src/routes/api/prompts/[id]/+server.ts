import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { PromptRepository } from "$lib/server/external_modules/MoLOS-AI-Knowledge/repositories/prompt-repository";
import { db } from "$lib/server/db";

const UpdatePromptSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isDeleted: z.boolean().optional(),
  commitMessage: z.string().optional(),
});

export const GET: RequestHandler = async ({ locals, params }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new PromptRepository(db);
  const prompt = await repo.getById(params.id, userId);
  if (!prompt) throw error(404, "Prompt not found");
  return json(prompt);
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = UpdatePromptSchema.parse(await request.json());
  const repo = new PromptRepository(db);
  const prompt = await repo.update(params.id, userId, payload);
  if (!prompt) throw error(404, "Prompt not found");
  return json(prompt);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new PromptRepository(db);
  const deleted = await repo.softDelete(params.id, userId);
  if (!deleted) throw error(404, "Prompt not found");
  return json({ success: true });
};
