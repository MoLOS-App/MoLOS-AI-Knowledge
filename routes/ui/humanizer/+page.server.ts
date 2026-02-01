import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import {
	AiProvider,
	HumanizationLevel,
	HumanizationTone,
	type AiProviderSettings,
	type HumanizerJob
} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
import { HumanizerJobRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/humanizer-job-repository';
import { AiProviderSettingsRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/ai-provider-settings-repository';
import { runHumanizerPipeline } from '$lib/utils/external_modules/MoLOS-AI-Knowledge/humanizer';
import { db } from '$lib/server/db';

const safeFetch = async <T>(fetcher: typeof fetch, url: string, fallback: T): Promise<T> => {
	try {
		const res = await fetcher(url);
		if (!res.ok) return fallback;
		return (await res.json()) as T;
	} catch {
		return fallback;
	}
};

export const load: PageServerLoad = async ({ fetch }) => {
	const [jobs, settings] = await Promise.all([
		safeFetch<HumanizerJob[]>(fetch, '/api/MoLOS-AI-Knowledge/humanizer', []),
		safeFetch<AiProviderSettings | null>(fetch, '/api/MoLOS-AI-Knowledge/settings', null)
	]);

	const provider = settings?.provider ?? AiProvider.OPENAI;
	const modelData = await safeFetch<{ provider: string; models: string[] }>(
		fetch,
		`/api/MoLOS-AI-Knowledge/models?provider=${encodeURIComponent(provider)}`,
		{ provider, models: [] }
	);

	return {
		jobs,
		settings,
		models: modelData.models
	};
};

const optionalNumber = (schema: z.ZodNumber | z.ZodEffectsAny) =>
	z.preprocess(
		(value) => {
			if (value === '' || value === null || value === undefined) return undefined;
			return value;
		},
		'_def' in schema && schema._def.typeName === 'ZodEffects'
			? (schema as z.ZodEffectsAny)._def.schema.optional()
			: schema.optional()
	);

const HumanizeSchema = z.object({
	inputText: z.string().min(1),
	level: z.nativeEnum(HumanizationLevel),
	tone: z.nativeEnum(HumanizationTone),
	model: z.string().min(1).optional(),
	options: z.string().optional(),
	temperature: optionalNumber(z.coerce.number().min(0).max(2)),
	topP: optionalNumber(z.coerce.number().min(0).max(1)),
	frequencyPenalty: optionalNumber(z.coerce.number().min(0).max(2)),
	presencePenalty: optionalNumber(z.coerce.number().min(0).max(2)),
	maxTokens: optionalNumber(z.coerce.number().min(64).max(8192))
});

export const actions: Actions = {
	humanize: async ({ locals, request }) => {
		const userId = locals.user?.id;
		if (!userId) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const payload = HumanizeSchema.safeParse({
			inputText: formData.get('inputText'),
			level: formData.get('level'),
			tone: formData.get('tone'),
			model: formData.get('model'),
			options: formData.get('options'),
			temperature: formData.get('temperature'),
			topP: formData.get('topP'),
			frequencyPenalty: formData.get('frequencyPenalty'),
			presencePenalty: formData.get('presencePenalty'),
			maxTokens: formData.get('maxTokens')
		});

		if (!payload.success) {
			return fail(400, { message: 'Invalid humanizer input.' });
		}

		try {
			const settingsRepo = new AiProviderSettingsRepository(db);
			const providerSettings = await settingsRepo.getByUserId(userId);

			const defaultModels = [
				'gpt-4',
				'gpt-4-turbo',
				'claude-sonnet-4-5',
				'claude-haiku-4-5',
				'gemini-pro'
			];
			const allowedModels = providerSettings?.preconfiguredModels?.length
				? providerSettings.preconfiguredModels
				: defaultModels;
			const requestedModel = payload.data.model?.trim();
			const selectedModel =
				requestedModel && allowedModels.includes(requestedModel) ? requestedModel : undefined;

			const result = await runHumanizerPipeline({
				inputText: payload.data.inputText,
				level: payload.data.level,
				tone: payload.data.tone,
				providerSettings,
				model: selectedModel,
				optionsText: payload.data.options,
				settings: {
					temperature: payload.data.temperature,
					topP: payload.data.topP,
					frequencyPenalty: payload.data.frequencyPenalty,
					presencePenalty: payload.data.presencePenalty,
					maxTokens: payload.data.maxTokens
				}
			});

			const repo = new HumanizerJobRepository(db);
			const job = await repo.create(userId, {
				inputText: payload.data.inputText,
				outputText: result.outputText,
				level: payload.data.level,
				tone: payload.data.tone,
				confidenceScore: result.confidenceScore
			});

			return {
				outputText: result.outputText,
				confidenceScore: result.confidenceScore,
				detectorScore: result.detectorScore,
				usedFallback: result.usedFallback,
				jobId: job.id
			};
		} catch (error) {
			console.error('Humanizer failed:', error);
			return fail(500, { message: 'Humanizer failed. Please try again.' });
		}
	}
};
