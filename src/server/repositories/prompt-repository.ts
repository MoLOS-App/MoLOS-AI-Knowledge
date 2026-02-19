import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { prompts, promptVersions } from "../db/schema";
import type {
  CreatePromptInput,
  Prompt,
  PromptVersion,
  UpdatePromptInput,
} from "../../../models";
import { BaseRepository } from "./base-repository";
import { parseJsonArray, toJsonString } from "./utils";

export type PromptListFilters = {
  search?: string;
  tag?: string;
  includeDeleted?: boolean;
  limit?: number;
};

export class PromptRepository extends BaseRepository {
	private mapPrompt(row: typeof prompts.$inferSelect): Prompt {
		return {
			id: row.id,
			userId: row.userId,
			title: row.title,
			description: row.description ?? undefined,
			content: row.content,
			tags: parseJsonArray(row.tags),
			isDeleted: row.isDeleted,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt
		};
	}

	private mapVersion(row: typeof promptVersions.$inferSelect): PromptVersion {
		return {
			...row,
			commitMessage: row.commitMessage ?? undefined,
			diffSummary: row.diffSummary ?? undefined
		};
	}

	async listByUserId(userId: string, filters: PromptListFilters = {}): Promise<Prompt[]> {
		const conditions = [eq(prompts.userId, userId)];

		if (!filters.includeDeleted) {
			conditions.push(eq(prompts.isDeleted, false));
		}

		if (filters.search) {
			const term = `%${filters.search}%`;
			const searchCondition = or(
				like(prompts.title, term),
				like(sql<string>`coalesce(${prompts.description}, '')`, term),
				like(prompts.content, term)
			);
			if (searchCondition) conditions.push(searchCondition);
		}

		if (filters.tag) {
			conditions.push(like(prompts.tags, `%"${filters.tag}"%`));
		}

    let query = this.db
      .select()
      .from(prompts)
      .where(and(...conditions))
      .orderBy(desc(prompts.updatedAt));

    if (filters.limit && filters.limit > 0) {
      query = query.limit(filters.limit);
    }

    const results = await query;

    return results.map((row) => this.mapPrompt(row));
  }

	async searchByUserId(userId: string, query: string, limit = 20): Promise<Prompt[]> {
		const term = `%${query}%`;
		const results = await this.db
			.select()
			.from(prompts)
			.where(
				and(
					eq(prompts.userId, userId),
					eq(prompts.isDeleted, false),
					or(
						like(prompts.title, term),
						like(sql<string>`coalesce(${prompts.description}, '')`, term),
						like(prompts.content, term)
					)
				)
			)
			.limit(limit)
			.orderBy(desc(prompts.updatedAt));

		return results.map((row) => this.mapPrompt(row));
	}

	async getById(id: string, userId: string): Promise<Prompt | null> {
		const result = await this.db
			.select()
			.from(prompts)
			.where(and(eq(prompts.id, id), eq(prompts.userId, userId)))
			.limit(1);

		return result[0] ? this.mapPrompt(result[0]) : null;
	}

	async create(data: CreatePromptInput, userId: string): Promise<Prompt> {
		return this.db.transaction((tx) => {
			const id = crypto.randomUUID();
			const now = Math.floor(Date.now() / 1000);
			const tags = toJsonString(data.tags, '[]');
			const inserted = tx
				.insert(prompts)
				.values({
					id,
					userId,
					title: data.title,
					description: data.description,
					content: data.content,
					tags
				})
				.returning()
				.all();

			const promptRow =
				inserted[0] ??
				({
					id,
					userId,
					title: data.title,
					description: data.description,
					content: data.content,
					tags,
					isDeleted: false,
					createdAt: now,
					updatedAt: now
				} as typeof prompts.$inferSelect);

			tx.insert(promptVersions)
				.values({
					promptId: promptRow.id ?? id,
					userId,
					versionNumber: 1,
					content: data.content,
					commitMessage: data.commitMessage
				})
				.run();

			return this.mapPrompt(promptRow);
		});
	}

	async update(id: string, userId: string, updates: UpdatePromptInput): Promise<Prompt | null> {
		return this.db.transaction((tx) => {
			const existing = tx
				.select()
				.from(prompts)
				.where(and(eq(prompts.id, id), eq(prompts.userId, userId)))
				.limit(1)
				.all();

			if (!existing[0]) return null;

			const updateData: Record<string, unknown> = {
				updatedAt: Math.floor(Date.now() / 1000)
			};

			if (updates.title !== undefined) updateData.title = updates.title;
			if (updates.description !== undefined) updateData.description = updates.description;
			if (updates.content !== undefined) updateData.content = updates.content;
			if (updates.tags !== undefined) updateData.tags = toJsonString(updates.tags, '[]');
			if (updates.isDeleted !== undefined) updateData.isDeleted = updates.isDeleted;

			const updated = tx
				.update(prompts)
				.set(updateData)
				.where(and(eq(prompts.id, id), eq(prompts.userId, userId)))
				.returning()
				.all();

			if (updates.content !== undefined) {
				const latestVersion = tx
					.select()
					.from(promptVersions)
					.where(and(eq(promptVersions.promptId, id), eq(promptVersions.userId, userId)))
					.orderBy(desc(promptVersions.versionNumber))
					.limit(1)
					.all();

				const nextVersion = (latestVersion[0]?.versionNumber ?? 0) + 1;

				tx.insert(promptVersions)
					.values({
						promptId: id,
						userId,
						versionNumber: nextVersion,
						content: updates.content,
						commitMessage: updates.commitMessage
					})
					.run();
			}

			const updatedRow =
				updated[0] ??
				({
					...existing[0],
					...updateData
				} as typeof prompts.$inferSelect);

			return updatedRow ? this.mapPrompt(updatedRow) : null;
		});
	}

	async softDelete(id: string, userId: string): Promise<boolean> {
		const result = await this.db
			.update(prompts)
			.set({
				isDeleted: true,
				updatedAt: Math.floor(Date.now() / 1000)
			})
			.where(and(eq(prompts.id, id), eq(prompts.userId, userId)));

		return result.changes > 0;
	}

	async listVersions(promptId: string, userId: string): Promise<PromptVersion[]> {
		const results = await this.db
			.select()
			.from(promptVersions)
			.where(and(eq(promptVersions.promptId, promptId), eq(promptVersions.userId, userId)))
			.orderBy(desc(promptVersions.versionNumber));

		return results.map((row) => this.mapVersion(row));
	}

	async deleteVersion(promptId: string, versionId: string, userId: string): Promise<boolean> {
		const versions = await this.db
			.select({ id: promptVersions.id })
			.from(promptVersions)
			.where(and(eq(promptVersions.promptId, promptId), eq(promptVersions.userId, userId)))
			.orderBy(desc(promptVersions.versionNumber));

		if (versions.length <= 1) return false;

		const result = await this.db
			.delete(promptVersions)
			.where(
				and(
					eq(promptVersions.id, versionId),
					eq(promptVersions.promptId, promptId),
					eq(promptVersions.userId, userId)
				)
			);

		return result.changes > 0;
	}
}
