import type { PageServerLoad } from './$types';
import type { PromptChain } from '$lib/models/external_modules/MoLOS-AI-Knowledge';

const safeFetch = async <T>(
	fetcher: typeof fetch,
	url: string,
	fallback: T
): Promise<T> => {
	try {
		const res = await fetcher(url);
		if (!res.ok) return fallback;
		return (await res.json()) as T;
	} catch {
		return fallback;
	}
};

export const load: PageServerLoad = async ({ fetch }) => {
	const chains = await safeFetch<PromptChain[]>(fetch, '/api/MoLOS-AI-Knowledge/prompt-chains', []);

	return {
		chains
	};
};
