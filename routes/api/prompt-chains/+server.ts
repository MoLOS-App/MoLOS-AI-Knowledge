import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { PromptChainRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/prompt-chain-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  definitionJson: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new PromptChainRepository(db);
  const chains = await repo.listByUserId(userId);
  return json(chains);
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = CreateSchema.parse(await request.json());
  const repo = new PromptChainRepository(db);
  const chain = await repo.create(userId, payload);
  return json(chain, { status: 201 });
};
