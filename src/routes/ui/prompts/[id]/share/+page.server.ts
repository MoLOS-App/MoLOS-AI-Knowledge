import type { PageServerLoad } from './$types';
import type { Prompt } from '../../models';

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

export const load: PageServerLoad = async ({ fetch, params }) => {
	const prompt = await safeFetch<Prompt | null>(
		fetch,
		`/api/MoLOS-AI-Knowledge/prompts/${params.id}`,
		null
	);

	return { prompt };
};
