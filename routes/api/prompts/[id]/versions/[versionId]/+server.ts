import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PromptRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/prompt-repository';
import { db } from '$lib/server/db';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new PromptRepository(db);
	const deleted = await repo.deleteVersion(params.id, params.versionId, userId);

	if (!deleted) {
		throw error(400, 'Unable to delete version');
	}

	return json({ ok: true });
};
