import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { promptChains } from "../db/schema";
import type {
  CreatePromptChainInput,
  PromptChain,
  UpdatePromptChainInput,
} from "../../../models";
import { BaseRepository } from "./base-repository";
import { parseJsonArray, toJsonString } from "./utils";

export class PromptChainRepository extends BaseRepository {
  private mapChain(row: typeof promptChains.$inferSelect): PromptChain {
    return {
      ...row,
      description: row.description ?? undefined,
      tags: parseJsonArray(row.tags),
    };
  }

  async listByUserId(userId: string): Promise<PromptChain[]> {
    const results = await this.db
      .select()
      .from(promptChains)
      .where(eq(promptChains.userId, userId))
      .orderBy(desc(promptChains.updatedAt));

    return results.map((row) => this.mapChain(row));
  }

  async searchByUserId(
    userId: string,
    query: string,
    limit: number = 50,
  ): Promise<PromptChain[]> {
    const term = `%${query}%`;
    const results = await this.db
      .select()
      .from(promptChains)
      .where(
        and(
          eq(promptChains.userId, userId),
          or(
            like(promptChains.name, term),
            like(sql<string>`coalesce(${promptChains.description}, '')`, term),
          ),
        ),
      )
      .orderBy(desc(promptChains.updatedAt))
      .limit(limit);

    return results.map((row) => this.mapChain(row));
  }

  async create(userId: string, data: CreatePromptChainInput): Promise<PromptChain> {
    const result = await this.db
      .insert(promptChains)
      .values({
        userId,
        name: data.name,
        description: data.description,
        definitionJson: data.definitionJson,
        tags: toJsonString(data.tags, "[]"),
      })
      .returning();

    return this.mapChain(result[0]);
  }

  async update(
    id: string,
    userId: string,
    updates: UpdatePromptChainInput,
  ): Promise<PromptChain | null> {
    const updateData: Record<string, unknown> = {
      updatedAt: Math.floor(Date.now() / 1000),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.definitionJson !== undefined) updateData.definitionJson = updates.definitionJson;
    if (updates.tags !== undefined) updateData.tags = toJsonString(updates.tags, "[]");

    const result = await this.db
      .update(promptChains)
      .set(updateData)
      .where(and(eq(promptChains.id, id), eq(promptChains.userId, userId)))
      .returning();

    return result[0] ? this.mapChain(result[0]) : null;
  }
}
