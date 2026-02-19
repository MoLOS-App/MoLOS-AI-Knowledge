import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { AbTestStatus } from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { AbTestRepository } from "$lib/server/external_modules/MoLOS-AI-Knowledge/repositories/ab-test-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
	name: z.string().min(1),
	promptIdsJson: z.string().min(2),
	datasetJson: z.string().min(2),
	resultsJson: z.string().optional().default('{}'),
	status: z.nativeEnum(AbTestStatus).default(AbTestStatus.DRAFT)
});

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new AbTestRepository(db);
	const tests = await repo.listByUserId(userId);
	return json(tests);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const payload = CreateSchema.parse(await request.json());
	const repo = new AbTestRepository(db);
	const test = await repo.create(userId, payload);
	return json(test, { status: 201 });
};
