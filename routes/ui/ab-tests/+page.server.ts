import type { PageServerLoad } from './$types';
import type { AbTest } from '$lib/models/external_modules/MoLOS-AI-Knowledge';

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
	const tests = await safeFetch<AbTest[]>(fetch, '/api/MoLOS-AI-Knowledge/ab-tests', []);

	return {
		tests
	};
};
