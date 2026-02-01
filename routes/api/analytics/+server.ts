import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { UsageAnalyticsRepository } from '$lib/repositories/external_modules/MoLOS-AI-Knowledge/usage-analytics-repository';
import { db } from '$lib/server/db';

const CreateSchema = z.object({
	entityType: z.string().min(1),
	entityId: z.string().optional(),
	metricType: z.string().min(1),
	value: z.number(),
	metadataJson: z.string().optional()
});

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const repo = new UsageAnalyticsRepository(db);
	const analytics = await repo.listByUserId(userId);
	return json(analytics);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const payload = CreateSchema.parse(await request.json());
	const repo = new UsageAnalyticsRepository(db);
	const record = await repo.record(userId, payload);
	return json(record, { status: 201 });
};
