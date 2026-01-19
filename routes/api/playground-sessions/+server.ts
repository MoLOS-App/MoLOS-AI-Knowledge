import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { PlaygroundSessionRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/playground-session-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
  promptId: z.string().optional(),
  model: z.string().min(1),
  settings: z.record(z.string(), z.unknown()),
  messages: z.array(z.unknown()),
  totalTokens: z.number().min(0),
  totalCost: z.number().min(0),
  latencyMs: z.number().optional(),
});

export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new PlaygroundSessionRepository(db);
  const sessions = await repo.listByUserId(userId);
  return json(sessions);
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = CreateSchema.parse(await request.json());
  const repo = new PlaygroundSessionRepository(db);
  const session = await repo.create(userId, payload);
  return json(session, { status: 201 });
};
