import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { PromptChainRepository } from "../../../../server/repositories/prompt-chain-repository";
import { db } from "$lib/server/db";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  definitionJson: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = UpdateSchema.parse(await request.json());
  const repo = new PromptChainRepository(db);
  const chain = await repo.update(params.id, userId, payload);
  if (!chain) throw error(404, "Chain not found");
  return json(chain);
};
