import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { SharedLibraryRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/shared-library-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
  promptId: z.string().min(1),
});

export const GET: RequestHandler = async ({ locals, params }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new SharedLibraryRepository(db);
  const isOwner = await repo.isOwner(params.id, userId);
  if (!isOwner) throw error(403, "Forbidden");

  const prompts = await repo.listPrompts(params.id);
  return json(prompts);
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new SharedLibraryRepository(db);
  const isOwner = await repo.isOwner(params.id, userId);
  if (!isOwner) throw error(403, "Forbidden");

  const payload = CreateSchema.parse(await request.json());
  const prompt = await repo.addPrompt(params.id, payload.promptId);
  return json(prompt, { status: 201 });
};
