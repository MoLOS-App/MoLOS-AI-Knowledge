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

const UpdateSchema = z.object({
  id: z.string().min(1),
  promptId: z.string().optional(),
  model: z.string().min(1).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  messages: z.array(z.unknown()).optional(),
  totalTokens: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  latencyMs: z.number().optional(),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
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

export const PUT: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = UpdateSchema.parse(await request.json());
  const { id, ...updates } = payload;
  const repo = new PlaygroundSessionRepository(db);
  const session = await repo.update(userId, id, updates);
  if (!session) throw error(404, "Playground session not found");
  return json(session);
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = DeleteSchema.parse(await request.json());
  const repo = new PlaygroundSessionRepository(db);
  const deleted = await repo.delete(userId, payload.id);
  if (!deleted) throw error(404, "Playground session not found");
  return json({ success: true });
};
