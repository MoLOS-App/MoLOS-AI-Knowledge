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
import { BaseRepository } from "./base-repository";

export class LlmFileRepository extends BaseRepository {
  private mapFile(row: typeof llmFiles.$inferSelect): LlmFile {
    return { ...row };
  }

  private mapVersion(row: typeof llmFileVersions.$inferSelect): LlmFileVersion {
    return {
      ...row,
      label: row.label ?? undefined,
      commitMessage: row.commitMessage ?? undefined,
    };
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
      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);
      const inserted = tx
        .insert(llmFiles)
        .values({
          id,
          userId,
          title: data.title,
          filename: data.filename,
        })
        .returning()
        .all();

      const fileRow =
        inserted[0] ??
        ({
          id,
          userId,
          title: data.title,
          filename: data.filename,
          currentVersion: 1,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        } as typeof llmFiles.$inferSelect);

      tx.insert(llmFileVersions).values({
        llmFileId: fileRow.id ?? id,
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
        .limit(1)
        .all();

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
          .limit(1)
          .all();

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
        .returning()
        .all();

      const updatedRow =
        updated[0] ??
        ({
          ...existing[0],
          ...updateData,
        } as typeof llmFiles.$inferSelect);

      return updatedRow ? this.mapFile(updatedRow) : null;
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
