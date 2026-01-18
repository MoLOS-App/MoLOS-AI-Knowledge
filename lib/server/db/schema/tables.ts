import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { textEnum } from "$lib/server/db/utils";
import {
  TaskStatus,
  TaskPriority,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";

/**
 * Tasks module table schema.
 * Keep table names prefixed by the module ID (hyphen or underscore).
 * All timestamps are unix seconds for consistency across modules.
 */

/**
 * All Tasks - Master task list.
 * `userId` is optional to keep the template flexible for local-only use cases.
 */
export const tasksTasks = sqliteTable("MoLOS-AI-Knowledge_tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id"),
  title: text("title").notNull(), // Task Name
  description: text("description"),
  status: textEnum("status", TaskStatus).notNull().default(TaskStatus.TO_DO),
  priority: textEnum("priority", TaskPriority)
    .notNull()
    .default(TaskPriority.MEDIUM),
  dueDate: integer("due_date"), // Unix timestamp in seconds
  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false), // Checkbox: "Done"
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(strftime('%s','now'))`),
});

/**
 * Legacy export for backward compatibility
 * @deprecated Use tasksTasks instead
 */
export const tasks = tasksTasks;
export { TaskStatus, TaskPriority };
