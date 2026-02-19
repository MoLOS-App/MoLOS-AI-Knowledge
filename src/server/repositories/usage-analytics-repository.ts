import { desc, eq } from "drizzle-orm";
import { usageAnalytics } from "../db/schema";
import type { UsageAnalytic } from "../../../models";
import { BaseRepository } from "./base-repository";
import { toJsonString } from "./utils";

export class UsageAnalyticsRepository extends BaseRepository {
  private mapRow(row: typeof usageAnalytics.$inferSelect): UsageAnalytic {
    return { ...row, entityId: row.entityId ?? undefined };
  }

  async listByUserId(userId: string, limit = 50): Promise<UsageAnalytic[]> {
    const results = await this.db
      .select()
      .from(usageAnalytics)
      .where(eq(usageAnalytics.userId, userId))
      .orderBy(desc(usageAnalytics.createdAt))
      .limit(limit);

    return results.map((row) => this.mapRow(row));
  }

  async record(
    userId: string,
    data: Omit<UsageAnalytic, "id" | "userId" | "createdAt" | "metadataJson"> & {
      metadataJson?: string;
    },
  ): Promise<UsageAnalytic> {
    const result = await this.db
      .insert(usageAnalytics)
      .values({
        userId,
        entityType: data.entityType,
        entityId: data.entityId,
        metricType: data.metricType,
        value: data.value,
        metadataJson: toJsonString(data.metadataJson ?? {}, "{}"),
      })
      .returning();

    return this.mapRow(result[0]);
  }
}
