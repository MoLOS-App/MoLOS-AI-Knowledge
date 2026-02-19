import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { PromptDeploymentRepository } from "$lib/server/external_modules/MoLOS-AI-Knowledge/repositories/prompt-deployment-repository";
import { db } from "$lib/server/db";

const CreateSchema = z.object({
	promptId: z.string().min(1),
	versionNumber: z.number().min(1),
	environmentLabel: z.string().min(1)
});

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const promptId = url.searchParams.get('promptId');
	if (!promptId) throw error(400, 'promptId is required');

	const repo = new PromptDeploymentRepository(db);
	const deployments = await repo.listByPrompt(promptId, userId);
	return json(deployments);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const payload = CreateSchema.parse(await request.json());
	const repo = new PromptDeploymentRepository(db);
	const deployment = await repo.create(
		payload.promptId,
		userId,
		payload.versionNumber,
		payload.environmentLabel
	);
	return json(deployment, { status: 201 });
};
