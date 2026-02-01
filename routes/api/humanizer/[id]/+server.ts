import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { HumanizerJobRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/humanizer-job-repository';
import { db } from '$lib/server/db';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new HumanizerJobRepository(db);
	const deleted = await repo.delete(userId, params.id);
	if (!deleted) throw error(404, 'Humanizer job not found');
	return json({ success: true });
};
