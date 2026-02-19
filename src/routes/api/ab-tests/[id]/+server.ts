import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { AbTestStatus } from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { AbTestRepository } from "$lib/server/external_modules/MoLOS-AI-Knowledge/repositories/ab-test-repository";
import { db } from "$lib/server/db";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  promptIdsJson: z.string().optional(),
  datasetJson: z.string().optional(),
  resultsJson: z.string().optional(),
  status: z.nativeEnum(AbTestStatus).optional(),
});

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = UpdateSchema.parse(await request.json());
  const repo = new AbTestRepository(db);
  const test = await repo.update(params.id, userId, payload);
  if (!test) throw error(404, "Test not found");
  return json(test);
};
