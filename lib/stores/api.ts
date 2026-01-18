import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";

/**
 * Tasks API Client
 * Keep this file limited to network calls. No state management here.
 */

// Tasks
export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/MoLOS-AI-Knowledge");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return await res.json();
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const res = await fetch("/api/MoLOS-AI-Knowledge", {
    method: "POST",
    // The core app expects JSON; keep payloads explicit.
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return await res.json();
}

export async function updateTask(
  id: string,
  updates: UpdateTaskInput,
): Promise<Task> {
  const res = await fetch("/api/MoLOS-AI-Knowledge", {
    method: "PUT",
    body: JSON.stringify({ id, ...updates }),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return await res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch("/api/MoLOS-AI-Knowledge", {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete task");
}
