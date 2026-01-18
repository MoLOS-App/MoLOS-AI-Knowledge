import { and, desc, eq } from "drizzle-orm";
import {
  llmFiles,
  llmFileVersions,
} from "$lib/server/db/schema/external_modules/MoLOS-AI-Knowledge/tables";
import type {
  CreateLlmFileInput,
  LlmFile,
  LlmFileVersion,
  UpdateLlmFileInput,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { BaseRepository } from "$lib/repositories/base-repository";

export class LlmFileRepository extends BaseRepository {
  private mapFile(row: typeof llmFiles.$inferSelect): LlmFile {
    return { ...row };
  }

  private mapVersion(row: typeof llmFileVersions.$inferSelect): LlmFileVersion {
    return { ...row };
  }

  async listByUserId(userId: string): Promise<LlmFile[]> {
    const results = await this.db
      .select()
      .from(llmFiles)
      .where(and(eq(llmFiles.userId, userId), eq(llmFiles.isDeleted, false)))
      .orderBy(desc(llmFiles.updatedAt));

    return results.map((row) => this.mapFile(row));
  }

  async getById(id: string, userId: string): Promise<LlmFile | null> {
    const result = await this.db
      .select()
      .from(llmFiles)
      .where(and(eq(llmFiles.id, id), eq(llmFiles.userId, userId)))
      .limit(1);

    return result[0] ? this.mapFile(result[0]) : null;
  }

  async create(data: CreateLlmFileInput, userId: string): Promise<LlmFile> {
    return this.db.transaction((tx) => {
      const inserted = tx
        .insert(llmFiles)
        .values({
          userId,
          title: data.title,
          filename: data.filename,
        })
        .returning();

      const fileRow = inserted[0];

      tx.insert(llmFileVersions).values({
        llmFileId: fileRow.id,
        userId,
        versionNumber: 1,
        content: data.content,
        label: data.label,
        commitMessage: data.commitMessage,
        schemaValid: true,
      });

      return this.mapFile(fileRow);
    });
  }

  async update(
    id: string,
    userId: string,
    updates: UpdateLlmFileInput,
  ): Promise<LlmFile | null> {
    return this.db.transaction((tx) => {
      const existing = tx
        .select()
        .from(llmFiles)
        .where(and(eq(llmFiles.id, id), eq(llmFiles.userId, userId)))
        .limit(1);

      if (!existing[0]) return null;

      const updateData: Record<string, unknown> = {
        updatedAt: Math.floor(Date.now() / 1000),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.filename !== undefined) updateData.filename = updates.filename;
      if (updates.isDeleted !== undefined) updateData.isDeleted = updates.isDeleted;

      if (updates.content !== undefined) {
        const latestVersion = tx
          .select()
          .from(llmFileVersions)
          .where(
            and(eq(llmFileVersions.llmFileId, id), eq(llmFileVersions.userId, userId)),
          )
          .orderBy(desc(llmFileVersions.versionNumber))
          .limit(1);

        const nextVersion = (latestVersion[0]?.versionNumber ?? 0) + 1;

        tx.insert(llmFileVersions).values({
          llmFileId: id,
          userId,
          versionNumber: nextVersion,
          content: updates.content,
          label: updates.label,
          commitMessage: updates.commitMessage,
          schemaValid: true,
        });

        updateData.currentVersion = nextVersion;
      }

      const updated = tx
        .update(llmFiles)
        .set(updateData)
        .where(and(eq(llmFiles.id, id), eq(llmFiles.userId, userId)))
        .returning();

      return updated[0] ? this.mapFile(updated[0]) : null;
    });
  }

  async listVersions(fileId: string, userId: string): Promise<LlmFileVersion[]> {
    const results = await this.db
      .select()
      .from(llmFileVersions)
      .where(and(eq(llmFileVersions.llmFileId, fileId), eq(llmFileVersions.userId, userId)))
      .orderBy(desc(llmFileVersions.versionNumber));

    return results.map((row) => this.mapVersion(row));
  }
}
