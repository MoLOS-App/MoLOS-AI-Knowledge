/**
 * Task Types - Minimal sample.
 * Keep this file small and add fields only when your module needs them.
 */

export const TaskStatus = {
  TO_DO: "to_do",
  DONE: "done",
} as const;

export const TaskPriority = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  // Status controls completion logic in the API and UI.
  status: (typeof TaskStatus)[keyof typeof TaskStatus];
  priority: (typeof TaskPriority)[keyof typeof TaskPriority];
  dueDate?: number; // Unix seconds
  isCompleted: boolean;
  createdAt: number; // Unix seconds
  updatedAt: number; // Unix seconds
}

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export type CreateTaskInput = Omit<
  Task,
  "id" | "userId" | "createdAt" | "updatedAt" | "isCompleted"
>;
export type UpdateTaskInput = Partial<CreateTaskInput>;
