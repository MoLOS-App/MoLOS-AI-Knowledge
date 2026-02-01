import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { AiProvider } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
import { AiProviderSettingsRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/ai-provider-settings-repository';
import { PromptRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/prompt-repository';
import { db } from '$lib/server/db';

const MessageSchema = z.object({
	role: z.enum(['system', 'user', 'assistant']),
	content: z.string()
});

const SettingsSchema = z.object({
	temperature: z.number().optional(),
	maxTokens: z.number().optional(),
	topP: z.number().optional(),
	frequencyPenalty: z.number().optional(),
	presencePenalty: z.number().optional()
});

const PlaygroundRequestSchema = z.object({
	promptId: z.string().optional(),
	model: z.string().min(1),
	messages: z.array(MessageSchema).min(1),
	settings: SettingsSchema.optional()
});

type ProviderUsage = {
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
};

type ProviderResponse = {
	message: string;
	usage?: ProviderUsage;
};

const normalizeMessages = (
	messages: Array<z.infer<typeof MessageSchema>>
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> =>
	messages.map((msg) => ({
		role: msg.role as 'user' | 'assistant' | 'system',
		content: msg.content
	}));

const buildOpenAiPayload = (
	messages: Array<z.infer<typeof MessageSchema>>,
	settings: z.infer<typeof SettingsSchema> | undefined,
	model: string
) => ({
	model,
	messages: normalizeMessages(messages),
	temperature: settings?.temperature,
	top_p: settings?.topP,
	max_tokens: settings?.maxTokens,
	frequency_penalty: settings?.frequencyPenalty,
	presence_penalty: settings?.presencePenalty
});

const buildAnthropicPayload = (
	messages: Array<z.infer<typeof MessageSchema>>,
	settings: z.infer<typeof SettingsSchema> | undefined,
	model: string,
	systemPrompt?: string
) => ({
	model,
	max_tokens: settings?.maxTokens ?? 1024,
	temperature: settings?.temperature,
	top_p: settings?.topP,
	system: systemPrompt,
	messages: normalizeMessages(messages.filter((msg) => msg.role !== 'system'))
});

const parseOpenAiResponse = (data: unknown): ProviderResponse => {
	const response = data as {
		choices?: Array<{ message?: { content?: string } }>;
		usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
	};
	const message = response.choices?.[0]?.message?.content ?? '';
	return {
		message,
		usage: response.usage
			? {
					inputTokens: response.usage.prompt_tokens,
					outputTokens: response.usage.completion_tokens,
					totalTokens: response.usage.total_tokens
				}
			: undefined
	};
};

const parseAnthropicResponse = (data: unknown): ProviderResponse => {
	const response = data as {
		content?: Array<{ type: string; text?: string }>;
		usage?: { input_tokens?: number; output_tokens?: number };
	};
	const message = response.content?.find((item) => item.type === 'text')?.text ?? '';
	return {
		message,
		usage: response.usage
			? {
					inputTokens: response.usage.input_tokens,
					outputTokens: response.usage.output_tokens,
					totalTokens:
						response.usage.input_tokens !== undefined && response.usage.output_tokens !== undefined
							? response.usage.input_tokens + response.usage.output_tokens
							: undefined
				}
			: undefined
	};
};

const callProvider = async (
	provider: string,
	apiToken: string,
	model: string,
	messages: Array<z.infer<typeof MessageSchema>>,
	settings?: z.infer<typeof SettingsSchema>,
	systemPrompt?: string
): Promise<ProviderResponse> => {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	let endpoint = '';
	let body: Record<string, unknown> = {};

	if (provider === AiProvider.ANTHROPIC) {
		endpoint = 'https://api.anthropic.com/v1/messages';
		headers['x-api-key'] = apiToken;
		headers['anthropic-version'] = '2023-06-01';
		body = buildAnthropicPayload(messages, settings, model, systemPrompt);
	} else {
		if (provider === AiProvider.OPENAI) {
			endpoint = 'https://api.openai.com/v1/chat/completions';
			headers.Authorization = `Bearer ${apiToken}`;
		} else if (provider === AiProvider.OPENROUTER) {
			endpoint = 'https://openrouter.ai/api/v1/chat/completions';
			headers.Authorization = `Bearer ${apiToken}`;
			headers['HTTP-Referer'] = 'https://molos.app';
			headers['X-Title'] = 'MoLOS';
		} else if (provider === AiProvider.XAI) {
			endpoint = 'https://api.x.ai/v1/chat/completions';
			headers.Authorization = `Bearer ${apiToken}`;
		} else {
			throw error(400, 'Unsupported provider');
		}
		body = buildOpenAiPayload(messages, settings, model);
	}

	const res = await fetch(endpoint, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw error(res.status, text || 'AI provider request failed');
	}

	const data = await res.json();
	return provider === AiProvider.ANTHROPIC
		? parseAnthropicResponse(data)
		: parseOpenAiResponse(data);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const payload = PlaygroundRequestSchema.parse(await request.json());

	const settingsRepo = new AiProviderSettingsRepository(db);
	const providerSettings = await settingsRepo.getByUserId(userId);
	const provider = providerSettings?.provider ?? AiProvider.OPENAI;

	if (!providerSettings?.apiToken) {
		throw error(400, 'Missing API token');
	}

	let systemPrompt: string | undefined;
	if (payload.promptId) {
		const promptRepo = new PromptRepository(db);
		const prompt = await promptRepo.getById(payload.promptId, userId);
		systemPrompt = prompt?.content?.trim() || undefined;
	}

	const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = systemPrompt
		? [{ role: 'system' as const, content: systemPrompt }, ...normalizeMessages(payload.messages)]
		: normalizeMessages(payload.messages);

	const start = Date.now();
	const result = await callProvider(
		provider,
		providerSettings.apiToken,
		payload.model,
		messages,
		payload.settings,
		systemPrompt
	);
	const latencyMs = Date.now() - start;

	return json({
		message: result.message,
		usage: result.usage,
		latencyMs
	});
};
