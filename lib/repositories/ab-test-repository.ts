import { and, desc, eq, like } from 'drizzle-orm';
import { abTests } from '$lib/server/db/schema/external_modules/MoLOS-AI-Knowledge/tables';
import type {
	AbTest,
	CreateAbTestInput,
	UpdateAbTestInput
} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
import { BaseRepository } from './base-repository';
import { toJsonString } from './utils';

export class AbTestRepository extends BaseRepository {
	private mapTest(row: typeof abTests.$inferSelect): AbTest {
		return { ...row };
	}

	async listByUserId(userId: string): Promise<AbTest[]> {
		const results = await this.db
			.select()
			.from(abTests)
			.where(eq(abTests.userId, userId))
			.orderBy(desc(abTests.updatedAt));

		return results.map((row) => this.mapTest(row));
	}

	async searchByUserId(userId: string, query: string, limit = 20): Promise<AbTest[]> {
		const term = `%${query}%`;
		const results = await this.db
			.select()
			.from(abTests)
			.where(and(eq(abTests.userId, userId), like(abTests.name, term)))
			.limit(limit)
			.orderBy(desc(abTests.updatedAt));

		return results.map((row) => this.mapTest(row));
	}

	async create(userId: string, data: CreateAbTestInput): Promise<AbTest> {
		const result = await this.db
			.insert(abTests)
			.values({
				userId,
				name: data.name,
				promptIdsJson: toJsonString(data.promptIdsJson, '[]'),
				datasetJson: toJsonString(data.datasetJson, '[]'),
				resultsJson: toJsonString(data.resultsJson, '{}'),
				status: data.status
			})
			.returning();

		return this.mapTest(result[0]);
	}

	async update(id: string, userId: string, updates: UpdateAbTestInput): Promise<AbTest | null> {
		const updateData: Record<string, unknown> = {
			updatedAt: Math.floor(Date.now() / 1000)
		};

		if (updates.name !== undefined) updateData.name = updates.name;
		if (updates.promptIdsJson !== undefined)
			updateData.promptIdsJson = toJsonString(updates.promptIdsJson, '[]');
		if (updates.datasetJson !== undefined)
			updateData.datasetJson = toJsonString(updates.datasetJson, '[]');
		if (updates.resultsJson !== undefined)
			updateData.resultsJson = toJsonString(updates.resultsJson, '{}');
		if (updates.status !== undefined) updateData.status = updates.status;

		const result = await this.db
			.update(abTests)
			.set(updateData)
			.where(and(eq(abTests.id, id), eq(abTests.userId, userId)))
			.returning();

		return result[0] ? this.mapTest(result[0]) : null;
	}
}
