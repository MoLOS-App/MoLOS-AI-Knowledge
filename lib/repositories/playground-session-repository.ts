import { and, desc, eq } from "drizzle-orm";
import { playgroundSessions } from "$lib/server/db/schema/external_modules/MoLOS-AI-Knowledge/tables";
import type { PlaygroundSession } from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { BaseRepository } from "./base-repository";
import { toJsonString } from "./utils";

export type PlaygroundSessionInput = {
  promptId?: string;
  model: string;
  settings: Record<string, unknown>;
  messages: unknown[];
  totalTokens: number;
  totalCost: number;
  latencyMs?: number;
};

export type PlaygroundSessionUpdate = Partial<PlaygroundSessionInput>;

export class PlaygroundSessionRepository extends BaseRepository {
  private mapSession(row: typeof playgroundSessions.$inferSelect): PlaygroundSession {
    return {
      ...row,
      promptId: row.promptId ?? undefined,
      latencyMs: row.latencyMs ?? undefined,
    };
  }

  async listByUserId(userId: string, limit = 20): Promise<PlaygroundSession[]> {
    const results = await this.db
      .select()
      .from(playgroundSessions)
      .where(eq(playgroundSessions.userId, userId))
      .orderBy(desc(playgroundSessions.updatedAt))
      .limit(limit);

    return results.map((row) => this.mapSession(row));
  }

  async create(userId: string, data: PlaygroundSessionInput): Promise<PlaygroundSession> {
    const result = await this.db
      .insert(playgroundSessions)
      .values({
        userId,
        promptId: data.promptId,
        model: data.model,
        settingsJson: toJsonString(data.settings, "{}"),
        messagesJson: toJsonString(data.messages, "[]"),
        totalTokens: data.totalTokens,
        totalCost: data.totalCost,
        latencyMs: data.latencyMs,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .returning();

    return this.mapSession(result[0]);
  }

  async update(
    userId: string,
    sessionId: string,
    data: PlaygroundSessionUpdate,
  ): Promise<PlaygroundSession | null> {
    const [result] = await this.db
      .update(playgroundSessions)
      .set({
        promptId: data.promptId,
        model: data.model,
        settingsJson:
          data.settings !== undefined ? toJsonString(data.settings, "{}") : undefined,
        messagesJson:
          data.messages !== undefined ? toJsonString(data.messages, "[]") : undefined,
        totalTokens: data.totalTokens,
        totalCost: data.totalCost,
        latencyMs: data.latencyMs,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(and(eq(playgroundSessions.id, sessionId), eq(playgroundSessions.userId, userId)))
      .returning();

    return result ? this.mapSession(result) : null;
  }

  async delete(userId: string, sessionId: string): Promise<boolean> {
    const [result] = await this.db
      .delete(playgroundSessions)
      .where(and(eq(playgroundSessions.id, sessionId), eq(playgroundSessions.userId, userId)))
      .returning({ id: playgroundSessions.id });

    return !!result;
  }
}
