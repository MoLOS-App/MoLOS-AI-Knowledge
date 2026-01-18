import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { LibraryRole } from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { SharedLibraryRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/shared-library-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(Object.values(LibraryRole) as [string, ...string[]]).default(LibraryRole.VIEWER),
});

export const POST: RequestHandler = async ({ locals, params, request }) => {
  const userId = locals.user?.id;
  if (!userId) throw error(401, "Unauthorized");

  const payload = CreateSchema.parse(await request.json());
  const repo = new SharedLibraryRepository(db);

  const isOwner = await repo.isOwner(params.id, userId);
  if (!isOwner) throw error(403, "Forbidden");

  const member = await repo.addMember(params.id, payload.memberId, payload.role);
  return json(member, { status: 201 });
};
