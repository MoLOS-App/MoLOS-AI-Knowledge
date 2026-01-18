import { TaskRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/task-repository";
import { TaskPriority, TaskStatus } from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import { db } from "$lib/server/db";

type ToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (params: any) => Promise<any>;
};

// Minimal AI tools for the boilerplate module.
export function getAiTools(userId: string): ToolDefinition[] {
  const taskRepo = new TaskRepository(db as any);

  return [
    {
      name: "get_tasks",
      description: "List tasks for the current user.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["to_do", "done"] },
          limit: { type: "number", default: 50 },
        },
      },
      execute: async (params) => {
        let tasks = await taskRepo.getByUserId(userId, params.limit || 50);
        if (params.status) {
          tasks = tasks.filter((t) => t.status === params.status);
        }
        return tasks;
      },
    },
    {
      name: "create_task",
      description: "Create a single task.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          dueDate: { type: "number" },
        },
        required: ["title"],
      },
      execute: async (params) => {
        return await taskRepo.create({
          userId,
          title: params.title,
          description: params.description,
          status: TaskStatus.TO_DO,
          priority: params.priority || TaskPriority.MEDIUM,
          dueDate: params.dueDate,
          isCompleted: false,
        });
      },
    },
  ];
}
