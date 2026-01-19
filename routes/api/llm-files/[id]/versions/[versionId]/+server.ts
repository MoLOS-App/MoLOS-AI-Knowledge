import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { LlmFileRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/llm-file-repository';
import { db } from '$lib/server/db';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new LlmFileRepository(db);
	const nextVersion = await repo.deleteVersion(params.id, params.versionId, userId);

	if (!nextVersion) {
		throw error(400, 'Unable to delete version');
	}

	return json({ ok: true, currentVersion: nextVersion });
};
