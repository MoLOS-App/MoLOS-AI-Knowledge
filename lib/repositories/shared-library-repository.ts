import { and, desc, eq } from "drizzle-orm";
import {
  sharedLibraries,
  sharedLibraryMembers,
  sharedLibraryPrompts,
} from "$lib/server/db/schema/external_modules/MoLOS-AI-Knowledge/tables";
import type {
  CreateSharedLibraryInput,
  SharedLibrary,
  SharedLibraryMember,
  SharedLibraryPrompt,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { BaseRepository } from "$lib/repositories/base-repository";

export class SharedLibraryRepository extends BaseRepository {
  private mapLibrary(row: typeof sharedLibraries.$inferSelect): SharedLibrary {
    return { ...row };
  }

  private mapMember(row: typeof sharedLibraryMembers.$inferSelect): SharedLibraryMember {
    return { ...row };
  }

  private mapPrompt(row: typeof sharedLibraryPrompts.$inferSelect): SharedLibraryPrompt {
    return { ...row };
  }

  async listByOwner(userId: string): Promise<SharedLibrary[]> {
    const results = await this.db
      .select()
      .from(sharedLibraries)
      .where(eq(sharedLibraries.ownerUserId, userId))
      .orderBy(desc(sharedLibraries.updatedAt));

    return results.map((row) => this.mapLibrary(row));
  }

  async create(ownerUserId: string, data: CreateSharedLibraryInput): Promise<SharedLibrary> {
    const result = await this.db
      .insert(sharedLibraries)
      .values({
        ownerUserId,
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate ?? true,
      })
      .returning();

    return this.mapLibrary(result[0]);
  }

  async addMember(
    libraryId: string,
    userId: string,
    role: string,
  ): Promise<SharedLibraryMember> {
    const result = await this.db
      .insert(sharedLibraryMembers)
      .values({
        libraryId,
        userId,
        role,
      })
      .returning();

    return this.mapMember(result[0]);
  }

  async addPrompt(libraryId: string, promptId: string): Promise<SharedLibraryPrompt> {
    const result = await this.db
      .insert(sharedLibraryPrompts)
      .values({
        libraryId,
        promptId,
      })
      .returning();

    return this.mapPrompt(result[0]);
  }

  async listPrompts(libraryId: string): Promise<SharedLibraryPrompt[]> {
    const results = await this.db
      .select()
      .from(sharedLibraryPrompts)
      .where(eq(sharedLibraryPrompts.libraryId, libraryId));

    return results.map((row) => this.mapPrompt(row));
  }

  async isOwner(libraryId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: sharedLibraries.id })
      .from(sharedLibraries)
      .where(and(eq(sharedLibraries.id, libraryId), eq(sharedLibraries.ownerUserId, userId)))
      .limit(1);

    return Boolean(result[0]);
  }
}
