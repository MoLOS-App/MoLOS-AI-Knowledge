import { derived, writable } from "svelte/store";
import type {
  AbTest,
  HumanizerJob,
  LlmFile,
  PlaygroundSession,
  Prompt,
  PromptChain,
  SharedLibrary,
  UsageAnalytic,
} from "$lib/models/external_modules/MoLOS-AI-Knowledge";
import * as api from "./api";

export const promptsStore = writable<Prompt[]>([]);
export const llmFilesStore = writable<LlmFile[]>([]);
export const sessionsStore = writable<PlaygroundSession[]>([]);
export const humanizerStore = writable<HumanizerJob[]>([]);
export const chainsStore = writable<PromptChain[]>([]);
export const abTestsStore = writable<AbTest[]>([]);
export const analyticsStore = writable<UsageAnalytic[]>([]);
export const librariesStore = writable<SharedLibrary[]>([]);

export const moduleUIState = writable({
  loading: false,
  error: null as string | null,
  lastLoaded: null as number | null,
});

export const promptStats = derived(promptsStore, ($prompts) => {
  const total = $prompts.length;
  const favorites = $prompts.filter((p) => p.isFavorite).length;
  const deleted = $prompts.filter((p) => p.isDeleted).length;

  return { total, favorites, deleted };
});

export async function loadModuleData() {
  moduleUIState.update((state) => ({ ...state, loading: true, error: null }));

  try {
    const [prompts, files, sessions, jobs, chains, tests, analytics, libraries] =
      await Promise.all([
        api.fetchPrompts(),
        api.fetchLlmFiles(),
        api.fetchPlaygroundSessions(),
        api.fetchHumanizerJobs(),
        api.fetchPromptChains(),
        api.fetchAbTests(),
        api.fetchAnalytics(),
        api.fetchSharedLibraries(),
      ]);

    promptsStore.set(prompts);
    llmFilesStore.set(files);
    sessionsStore.set(sessions);
    humanizerStore.set(jobs);
    chainsStore.set(chains);
    abTestsStore.set(tests);
    analyticsStore.set(analytics);
    librariesStore.set(libraries);

    moduleUIState.update((state) => ({
      ...state,
      loading: false,
      lastLoaded: Date.now(),
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load module data";
    moduleUIState.update((state) => ({ ...state, loading: false, error: message }));
  }
}

export async function refreshPrompts() {
  promptsStore.set(await api.fetchPrompts());
}

export async function refreshLlmFiles() {
  llmFilesStore.set(await api.fetchLlmFiles());
}

export async function refreshSessions() {
  sessionsStore.set(await api.fetchPlaygroundSessions());
}

export async function refreshHumanizerJobs() {
  humanizerStore.set(await api.fetchHumanizerJobs());
}

export async function refreshChains() {
  chainsStore.set(await api.fetchPromptChains());
}

export async function refreshAbTests() {
  abTestsStore.set(await api.fetchAbTests());
}

export async function refreshAnalytics() {
  analyticsStore.set(await api.fetchAnalytics());
}

export async function refreshLibraries() {
  librariesStore.set(await api.fetchSharedLibraries());
}
