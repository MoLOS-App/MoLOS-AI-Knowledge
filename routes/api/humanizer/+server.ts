import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import {
  HumanizationLevel,
  HumanizationTone,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { HumanizerJobRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/humanizer-job-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
  inputText: z.string().min(1),
  outputText: z.string().optional(),
  level: z.nativeEnum(HumanizationLevel),
  tone: z.nativeEnum(HumanizationTone),
  confidenceScore: z.number().min(0).max(100),
});

export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new HumanizerJobRepository(db);
  const jobs = await repo.listByUserId(userId);
  return json(jobs);
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = CreateSchema.parse(await request.json());
  const repo = new HumanizerJobRepository(db);
  const job = await repo.create(userId, payload);
  return json(job, { status: 201 });
};
