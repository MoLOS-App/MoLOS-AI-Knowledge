import { writable, derived } from "svelte/store";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import * as api from "./api";

/**
 * Tasks Module Store
 * Single source of truth for UI state and task data.
 */

// Data Store
export const tasksStore = writable<Task[]>([]);

// UI state for the page (loading and error handling).
export const tasksUIState = writable({
  loading: false,
  error: null as string | null,
  lastLoaded: null as number | null,
});

// Derived stats used by the UI dashboard tiles.
export const taskStats = derived(tasksStore, ($tasks) => {
  const total = $tasks.length;
  const completed = $tasks.filter((t) => t.isCompleted).length;
  const active = total - completed;

  return { total, completed, active };
});

/**
 * Actions
 */

export async function loadAllTasksData() {
  // Keep the load path simple for a boilerplate module.
  tasksUIState.update((s) => ({ ...s, loading: true, error: null }));

  try {
    const tasks = await api.fetchTasks();
    tasksStore.set(tasks);

    tasksUIState.update((s) => ({
      ...s,
      loading: false,
      lastLoaded: Date.now(),
    }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load tasks data";
    tasksUIState.update((s) => ({ ...s, loading: false, error: message }));
    console.error("Tasks store load error:", err);
  }
}

// Task Actions
export async function addTaskStore(data: CreateTaskInput) {
  try {
    const newTask = await api.createTask(data);
    tasksStore.update((tasks) => [newTask, ...tasks]);
    return newTask;
  } catch (err) {
    console.error("Failed to add task:", err);
    throw err;
  }
}

export async function updateTaskStore(id: string, updates: UpdateTaskInput) {
  try {
    const updatedTask = await api.updateTask(id, updates);
    tasksStore.update((tasks) =>
      tasks.map((t) => (t.id === id ? updatedTask : t)),
    );
    return updatedTask;
  } catch (err) {
    console.error("Failed to update task:", err);
    throw err;
  }
}

export async function deleteTaskStore(id: string) {
  try {
    await api.deleteTask(id);
    tasksStore.update((tasks) => tasks.filter((t) => t.id !== id));
  } catch (err) {
    console.error("Failed to delete task:", err);
    throw err;
  }
}
