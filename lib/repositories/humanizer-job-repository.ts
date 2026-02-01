import { and, desc, eq } from 'drizzle-orm';
import { humanizerJobs } from '$lib/server/db/schema/external_modules/MoLOS-AI-Knowledge/tables';
import type {
	CreateHumanizerJobInput,
	HumanizerJob
} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
import { BaseRepository } from './base-repository';

export class HumanizerJobRepository extends BaseRepository {
	private mapJob(row: typeof humanizerJobs.$inferSelect): HumanizerJob {
		return { ...row, outputText: row.outputText ?? undefined };
	}

	async listByUserId(userId: string, limit = 20): Promise<HumanizerJob[]> {
		const results = await this.db
			.select()
			.from(humanizerJobs)
			.where(eq(humanizerJobs.userId, userId))
			.orderBy(desc(humanizerJobs.createdAt))
			.limit(limit);

		return results.map((row) => this.mapJob(row));
	}

	async create(userId: string, data: CreateHumanizerJobInput): Promise<HumanizerJob> {
		const result = await this.db
			.insert(humanizerJobs)
			.values({
				userId,
				inputText: data.inputText,
				outputText: data.outputText,
				level: data.level,
				tone: data.tone,
				confidenceScore: data.confidenceScore,
				status: 'completed',
				updatedAt: Math.floor(Date.now() / 1000)
			})
			.returning();

		return this.mapJob(result[0]);
	}

	async delete(userId: string, jobId: string): Promise<boolean> {
		const [result] = await this.db
			.delete(humanizerJobs)
			.where(and(eq(humanizerJobs.id, jobId), eq(humanizerJobs.userId, userId)))
			.returning({ id: humanizerJobs.id });

		return !!result;
	}
}
