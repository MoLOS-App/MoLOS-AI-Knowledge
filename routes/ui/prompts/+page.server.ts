import type { PageServerLoad } from './$types';
import type { Prompt, LlmFile } from '$lib/models/external_modules/MoLOS-AI-Knowledge';

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
	const prompts = await safeFetch<Prompt[]>(fetch, '/api/MoLOS-AI-Knowledge/prompts', []);
	const files = await safeFetch<LlmFile[]>(fetch, '/api/MoLOS-AI-Knowledge/llm-files', []);

	return {
		prompts,
		files
	};
};
