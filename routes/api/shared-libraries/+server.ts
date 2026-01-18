import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { SharedLibraryRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/shared-library-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const repo = new SharedLibraryRepository(db);
  const libraries = await repo.listByOwner(userId);
  return json(libraries);
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = CreateSchema.parse(await request.json());
  const repo = new SharedLibraryRepository(db);
  const library = await repo.create(userId, payload);
  return json(library, { status: 201 });
};
