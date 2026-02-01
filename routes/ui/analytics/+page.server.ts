import type { PageServerLoad } from './$types';
import type { UsageAnalytic } from '$lib/models/external_modules/MoLOS-AI-Knowledge';

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
	const analytics = await safeFetch<UsageAnalytic[]>(
		fetch,
		'/api/MoLOS-AI-Knowledge/analytics',
		[]
	);

	return {
		analytics
	};
};
