import { TaskRepository } from "$lib/repositories/external_modules/MoLOS-AI-Knowledge/task-repository";
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import {
  TaskStatus,
  TaskPriority,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge/";
import { db } from "$lib/server/db";

// API contract for the module. Keep all request validation here.

// Shared schema between POST and PUT.
const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.number().optional(),
});

const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: z.string().min(1, "Task id is required"),
});

/**
 * GET /api/MoLOS-AI-Knowledge
 * Returns the list of all tasks for the authenticated user
 */
export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) {
    throw error(401, "Unauthorized");
  }

  try {
    // Repository isolates DB access and keeps this handler small.
    const taskRepo = new TaskRepository(db);
    const tasks = await taskRepo.getByUserId(userId, 100);
    return json(tasks);
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
    throw error(500, "Internal server error");
  }
};

/**
 * POST /api/MoLOS-AI-Knowledge
 * Creates a new task
 * Expected JSON body: { title: string, description?: string, status?: string, priority?: string, dueDate?: number }
 */
export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) {
    throw error(401, "Unauthorized");
  }

  try {
    const body = await request.json();
    const result = CreateTaskSchema.safeParse(body);

    if (!result.success) {
      throw error(400, result.error.issues[0].message);
    }

    const { title, description, status, priority, dueDate } = result.data;

    const taskRepo = new TaskRepository(db);
    const task = await taskRepo.create({
      userId,
      title,
      description,
      status: status || TaskStatus.TO_DO,
      priority: priority || TaskPriority.MEDIUM,
      dueDate,
      isCompleted: false,
    });

    return json(task, { status: 201 });
  } catch (err) {
    console.error("Failed to create task:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

/**
 * PUT /api/MoLOS-AI-Knowledge
 * Updates an existing task
 */
export const PUT: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) {
    throw error(401, "Unauthorized");
  }

  try {
    const body = await request.json();
    const result = UpdateTaskSchema.safeParse(body);

    if (!result.success) {
      throw error(400, result.error.issues[0].message);
    }

    const { id, ...updates } = result.data;

    // Keep completion in sync with status changes.
    const finalUpdates: any = { ...updates };
    if (updates.status) {
      finalUpdates.isCompleted = updates.status === TaskStatus.DONE;
    }

    const taskRepo = new TaskRepository(db);
    const task = await taskRepo.update(id, userId, finalUpdates);

    if (!task) {
      throw error(404, "Task not found");
    }

    return json(task);
  } catch (err) {
    console.error("Failed to update task:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

/**
 * DELETE /api/MoLOS-AI-Knowledge
 * Deletes a task
 */
export const DELETE: RequestHandler = async ({ locals, request }) => {
  const userId = locals.user?.id;
  if (!userId) {
    throw error(401, "Unauthorized");
  }

  try {
    const { id } = await request.json();

    if (!id) {
      throw error(400, "Task id is required");
    }

    const taskRepo = new TaskRepository(db);
    const deleted = await taskRepo.delete(id, userId);

    if (!deleted) {
      throw error(404, "Task not found");
    }

    return json({ success: true });
  } catch (err) {
    console.error("Failed to delete task:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
