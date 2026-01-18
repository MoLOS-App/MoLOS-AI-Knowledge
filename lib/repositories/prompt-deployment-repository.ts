import { and, desc, eq } from "drizzle-orm";
import { promptDeployments } from "$lib/server/db/schema/external_modules/MoLOS-AI-Knowledge/tables";
import type { PromptDeployment } from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { BaseRepository } from "$lib/repositories/base-repository";

export class PromptDeploymentRepository extends BaseRepository {
  private mapRow(row: typeof promptDeployments.$inferSelect): PromptDeployment {
    return { ...row };
  }

  async listByPrompt(promptId: string, userId: string): Promise<PromptDeployment[]> {
    const results = await this.db
      .select()
      .from(promptDeployments)
      .where(and(eq(promptDeployments.promptId, promptId), eq(promptDeployments.userId, userId)))
      .orderBy(desc(promptDeployments.createdAt));

    return results.map((row) => this.mapRow(row));
  }

  async create(
    promptId: string,
    userId: string,
    versionNumber: number,
    environmentLabel: string,
  ): Promise<PromptDeployment> {
    const result = await this.db
      .insert(promptDeployments)
      .values({
        promptId,
        userId,
        versionNumber,
        environmentLabel,
      })
      .returning();

    return this.mapRow(result[0]);
  }
}
