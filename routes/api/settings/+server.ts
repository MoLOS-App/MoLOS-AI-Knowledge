import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { AiProvider } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
import { AiProviderSettingsRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/ai-provider-settings-repository';

const UpdateSettingsSchema = z.object({
	provider: z
		.enum([AiProvider.OPENAI, AiProvider.ANTHROPIC, AiProvider.OPENROUTER, AiProvider.XAI])
		.optional(),
	apiToken: z.string().optional(),
	preconfiguredModels: z.array(z.string().min(1)).optional()
});

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new AiProviderSettingsRepository();
	const settings = await repo.getByUserId(userId);
	return json(settings);
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const payload = UpdateSettingsSchema.parse(await request.json());
	const repo = new AiProviderSettingsRepository();
	const updated = await repo.update(userId, payload);

	if (!updated) throw error(404, 'Not found');
	return json(updated);
};
