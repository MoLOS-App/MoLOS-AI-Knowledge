import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Prompt, PromptVersion } from '$lib/models/external_modules/MoLOS-AI-Knowledge';

const safeFetch = async <T>(fetcher: typeof fetch, url: string, fallback: T): Promise<T> => {
	try {
		const res = await fetcher(url);
		if (!res.ok) return fallback;
		return (await res.json()) as T;
	} catch {
		return fallback;
	}
};

export const load: PageServerLoad = async ({ fetch, params }) => {
	if (params.id === 'new') {
		return {
			isNew: true,
			prompt: null,
			versions: []
		};
	}

	const prompt = await safeFetch<Prompt | null>(
		fetch,
		`/api/MoLOS-AI-Knowledge/prompts/${params.id}`,
		null
	);

	if (!prompt) {
		throw error(404, 'Prompt not found');
	}

	const versions = await safeFetch<PromptVersion[]>(
		fetch,
		`/api/MoLOS-AI-Knowledge/prompts/${params.id}/versions`,
		[]
	);

	return {
		isNew: false,
		prompt,
		versions
	};
};
