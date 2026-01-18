import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { LlmFileRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/llm-file-repository";
import { db } from "$lib/server/db";

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  label: z.string().optional(),
  commitMessage: z.string().optional(),
  isDeleted: z.boolean().optional(),
});

export const GET: RequestHandler = async ({ locals, params }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new LlmFileRepository(db);
  const file = await repo.getById(params.id, userId);
  if (!file) throw error(404, "File not found");
  return json(file);
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = UpdateSchema.parse(await request.json());
  const repo = new LlmFileRepository(db);
  const file = await repo.update(params.id, userId, payload);
  if (!file) throw error(404, "File not found");
  return json(file);
};
