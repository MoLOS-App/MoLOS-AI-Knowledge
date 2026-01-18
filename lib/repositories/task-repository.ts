import { eq, and, count } from "drizzle-orm";
import { tasksTasks } from "$lib/server/db/schema/external_modules/MoLOS-AI-Knowledge/tables";
import type {
  Task,
  TaskStatus,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { BaseRepository } from "$lib/repositories/base-repository";

// Thin data access layer for the module. Keep business logic in routes/stores.
export class TaskRepository extends BaseRepository {
  // Normalize DB rows into the Task shape used by the module.
  private mapToTask(row: Record<string, unknown>): Task {
    return {
      ...row,
      userId: (row.userId as string) || "",
      description: (row.description as string) || undefined,
      dueDate: (row.dueDate as number) || undefined,
    } as unknown as Task;
  }

  async getByUserId(userId: string, limit: number = 50): Promise<Task[]> {
    const result = await this.db
      .select()
      .from(tasksTasks)
      .where(eq(tasksTasks.userId, userId))
      .limit(limit);

    return result.map((row) => this.mapToTask(row));
  }

  async getById(id: string, userId: string): Promise<Task | null> {
    const result = await this.db
      .select()
      .from(tasksTasks)
      .where(and(eq(tasksTasks.id, id), eq(tasksTasks.userId, userId)))
      .limit(1);

    return result[0] ? this.mapToTask(result[0]) : null;
  }

  async create(
    task: Omit<Task, "id" | "createdAt" | "updatedAt">,
  ): Promise<Task> {
    const result = await this.db
      .insert(tasksTasks)
      .values(task)
      .returning();

    return this.mapToTask(result[0] as unknown as Record<string, unknown>);
  }

  async update(
    id: string,
    userId: string,
    updates: Partial<Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">>,
  ): Promise<Task | null> {
    // Always bump updatedAt so UI can reflect changes immediately.
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: Math.floor(Date.now() / 1000),
    };

    const result = await this.db
      .update(tasksTasks)
      .set(updateData)
      .where(and(eq(tasksTasks.id, id), eq(tasksTasks.userId, userId)))
      .returning();

    return result[0]
      ? this.mapToTask(result[0] as unknown as Record<string, unknown>)
      : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(tasksTasks)
      .where(and(eq(tasksTasks.id, id), eq(tasksTasks.userId, userId)));

    return result.changes > 0;
  }

  async completeTask(id: string, userId: string): Promise<Task | null> {
    return this.update(id, userId, { isCompleted: true, status: "done" });
  }

  async countByStatus(userId: string, status: string): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(tasksTasks)
      .where(
        and(
          eq(tasksTasks.userId, userId),
          eq(tasksTasks.status, status as TaskStatus),
        ),
      );

    return result[0]?.value ?? 0;
  }
}
