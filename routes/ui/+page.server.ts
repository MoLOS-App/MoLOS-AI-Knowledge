import type { PageServerLoad } from './$types';
import type {
	HumanizerJob,
	PlaygroundSession,
	Prompt,
	UsageAnalytic
} from '$lib/models/external_modules/MoLOS-AI-Knowledge';

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
	const [prompts, sessions, jobs, analytics] = await Promise.all([
		safeFetch<Prompt[]>(fetch, '/api/MoLOS-AI-Knowledge/prompts', []),
		safeFetch<PlaygroundSession[]>(fetch, '/api/MoLOS-AI-Knowledge/playground-sessions', []),
		safeFetch<HumanizerJob[]>(fetch, '/api/MoLOS-AI-Knowledge/humanizer', []),
		safeFetch<UsageAnalytic[]>(fetch, '/api/MoLOS-AI-Knowledge/analytics', [])
	]);

	const favorites = prompts.filter((prompt) => prompt.isFavorite).length;
	const lastPrompt = prompts.reduce((latest, prompt) =>
		!latest || prompt.updatedAt > latest ? prompt.updatedAt : latest
	, 0);
	const lastSession = sessions.reduce((latest, session) =>
		!latest || session.updatedAt > latest ? session.updatedAt : latest
	, 0);
	const lastJob = jobs.reduce((latest, job) =>
		!latest || job.updatedAt > latest ? job.updatedAt : latest
	, 0);
	const lastActivity = Math.max(lastPrompt, lastSession, lastJob) || null;

	const recentPrompts = [...prompts]
		.sort((a, b) => b.updatedAt - a.updatedAt)
		.slice(0, 5);
	const recentSessions = [...sessions]
		.sort((a, b) => b.updatedAt - a.updatedAt)
		.slice(0, 5);
	const recentJobs = [...jobs]
		.sort((a, b) => b.updatedAt - a.updatedAt)
		.slice(0, 5);

	return {
		stats: {
			promptsTotal: prompts.length,
			favorites,
			sessionsTotal: sessions.length,
			jobsTotal: jobs.length,
			lastActivity
		},
		recent: {
			prompts: recentPrompts,
			sessions: recentSessions,
			jobs: recentJobs
		},
		analytics: analytics.slice(0, 6)
	};
};
