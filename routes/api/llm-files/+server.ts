import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { LlmFileRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/llm-file-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
  title: z.string().min(1),
  filename: z.string().min(1),
  content: z.string().min(1),
  label: z.string().optional(),
  commitMessage: z.string().optional(),
});

export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new LlmFileRepository(db);
  const files = await repo.listByUserId(userId);
  return json(files);
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = CreateSchema.parse(await request.json());
  const repo = new LlmFileRepository(db);
  const file = await repo.create(payload, userId);
  return json(file, { status: 201 });
};
