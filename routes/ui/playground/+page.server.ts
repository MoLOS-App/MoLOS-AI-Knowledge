import type { PageServerLoad } from './$types';
import type {
	AiProviderSettings,
	PlaygroundSession,
	Prompt
} from '$lib/models/external_modules/MoLOS-AI-Knowledge';

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
	const [prompts, sessions, settings] = await Promise.all([
		safeFetch<Prompt[]>(fetch, '/api/MoLOS-AI-Knowledge/prompts', []),
		safeFetch<PlaygroundSession[]>(fetch, '/api/MoLOS-AI-Knowledge/playground-sessions', []),
		safeFetch<AiProviderSettings | null>(fetch, '/api/MoLOS-AI-Knowledge/settings', null)
	]);

	const provider = settings?.provider ?? 'openai';
	const modelData = await safeFetch<{ provider: string; models: string[] }>(
		fetch,
		`/api/MoLOS-AI-Knowledge/models?provider=${encodeURIComponent(provider)}`,
		{ provider, models: [] }
	);

	return {
		prompts,
		sessions,
		settings,
		models: modelData.models
	};
};
