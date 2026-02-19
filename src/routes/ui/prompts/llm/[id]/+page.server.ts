import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type {
	LlmFile,
	LlmFileVersion
} from '../../models';

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
	if (params.id === 'new') {
		return {
			isNew: true,
			file: null,
			versions: []
		};
	}

	const file = await safeFetch<LlmFile | null>(
		fetch,
		`/api/MoLOS-AI-Knowledge/llm-files/${params.id}`,
		null
	);

	if (!file) {
		throw error(404, 'LLM.txt file not found');
	}

	const versions = await safeFetch<LlmFileVersion[]>(
		fetch,
		`/api/MoLOS-AI-Knowledge/llm-files/${params.id}/versions`,
		[]
	);

	return {
		isNew: false,
		file,
		versions
	};
};
