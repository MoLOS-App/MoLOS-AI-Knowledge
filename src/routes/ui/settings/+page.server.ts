import type { PageServerLoad } from "./$types";
import type { AiProviderSettings } from "../../models";

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
	const settings = await safeFetch<AiProviderSettings | null>(
		fetch,
		'/api/MoLOS-AI-Knowledge/settings',
		null
	);

	return { settings };
};
