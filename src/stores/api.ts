import type {
  AbTest,
  CreateAbTestInput,
  CreateHumanizerJobInput,
  CreateLlmFileInput,
  CreatePromptChainInput,
  CreatePromptInput,
  HumanizerJob,
  LlmFile,
  LlmFileVersion,
  AiProviderSettings,
  PlaygroundSession,
  Prompt,
  PromptChain,
  PromptDeployment,
  PromptVersion,
  UpdateAiProviderSettingsInput,
  UpdateAbTestInput,
  UpdateLlmFileInput,
  UpdatePromptChainInput,
  UpdatePromptInput,
  UsageAnalytic,
} from "../../models";

const base = '/api/MoLOS-AI-Knowledge';

async function handle<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || 'Request failed');
	}
	return await res.json();
}

export async function fetchPrompts(params?: URLSearchParams): Promise<Prompt[]> {
	const url = params ? `${base}/prompts?${params.toString()}` : `${base}/prompts`;
	return handle(await fetch(url));
}

export async function createPrompt(data: CreatePromptInput): Promise<Prompt> {
	return handle(
		await fetch(`${base}/prompts`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function updatePrompt(id: string, data: UpdatePromptInput): Promise<Prompt> {
	return handle(
		await fetch(`${base}/prompts/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function deletePrompt(id: string): Promise<void> {
	await handle(
		await fetch(`${base}/prompts/${id}`, {
			method: 'DELETE'
		})
	);
}

export async function fetchPromptVersions(id: string): Promise<PromptVersion[]> {
	return handle(await fetch(`${base}/prompts/${id}/versions`));
}

export async function deletePromptVersion(promptId: string, versionId: string): Promise<void> {
	await handle(
		await fetch(`${base}/prompts/${promptId}/versions/${versionId}`, {
			method: 'DELETE'
		})
	);
}

export async function fetchLlmFiles(): Promise<LlmFile[]> {
	return handle(await fetch(`${base}/llm-files`));
}

export async function createLlmFile(data: CreateLlmFileInput): Promise<LlmFile> {
	return handle(
		await fetch(`${base}/llm-files`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function updateLlmFile(id: string, data: UpdateLlmFileInput): Promise<LlmFile> {
	return handle(
		await fetch(`${base}/llm-files/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function fetchLlmFileVersions(id: string): Promise<LlmFileVersion[]> {
	return handle(await fetch(`${base}/llm-files/${id}/versions`));
}

export async function deleteLlmFileVersion(fileId: string, versionId: string): Promise<void> {
	await handle(
		await fetch(`${base}/llm-files/${fileId}/versions/${versionId}`, {
			method: 'DELETE'
		})
	);
}

export async function fetchPlaygroundSessions(): Promise<PlaygroundSession[]> {
	return handle(await fetch(`${base}/playground-sessions`));
}

export async function createPlaygroundSession(
	data: Omit<PlaygroundSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<PlaygroundSession> {
	return handle(
		await fetch(`${base}/playground-sessions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				promptId: data.promptId,
				model: data.model,
				settings: JSON.parse(data.settingsJson),
				messages: JSON.parse(data.messagesJson),
				totalTokens: data.totalTokens,
				totalCost: data.totalCost,
				latencyMs: data.latencyMs
			})
		})
	);
}

export async function updatePlaygroundSession(
	id: string,
	data: Partial<Omit<PlaygroundSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<PlaygroundSession> {
	return handle(
		await fetch(`${base}/playground-sessions`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id,
				promptId: data.promptId,
				model: data.model,
				settings: data.settingsJson ? JSON.parse(data.settingsJson) : undefined,
				messages: data.messagesJson ? JSON.parse(data.messagesJson) : undefined,
				totalTokens: data.totalTokens,
				totalCost: data.totalCost,
				latencyMs: data.latencyMs
			})
		})
	);
}

export async function deletePlaygroundSession(id: string): Promise<void> {
	await handle(
		await fetch(`${base}/playground-sessions`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id })
		})
	);
}

export async function fetchAiProviderSettings(): Promise<AiProviderSettings> {
	return handle(await fetch(`${base}/settings`));
}

export async function updateAiProviderSettings(
	data: UpdateAiProviderSettingsInput
): Promise<AiProviderSettings> {
	return handle(
		await fetch(`${base}/settings`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function fetchProviderModels(provider?: string): Promise<{
	provider: string;
	models: string[];
}> {
	const url = provider ? `${base}/models?provider=${provider}` : `${base}/models`;
	return handle(await fetch(url));
}

export async function fetchHumanizerJobs(): Promise<HumanizerJob[]> {
	return handle(await fetch(`${base}/humanizer`));
}

export async function createHumanizerJob(data: CreateHumanizerJobInput): Promise<HumanizerJob> {
	return handle(
		await fetch(`${base}/humanizer`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function deleteHumanizerJob(id: string): Promise<{ success: boolean }> {
	return handle(
		await fetch(`${base}/humanizer/${id}`, {
			method: 'DELETE'
		})
	);
}

export async function fetchPromptChains(): Promise<PromptChain[]> {
	return handle(await fetch(`${base}/prompt-chains`));
}

export async function createPromptChain(data: CreatePromptChainInput): Promise<PromptChain> {
	return handle(
		await fetch(`${base}/prompt-chains`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function updatePromptChain(
	id: string,
	data: UpdatePromptChainInput
): Promise<PromptChain> {
	return handle(
		await fetch(`${base}/prompt-chains/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function fetchAbTests(): Promise<AbTest[]> {
	return handle(await fetch(`${base}/ab-tests`));
}

export async function createAbTest(data: CreateAbTestInput): Promise<AbTest> {
	return handle(
		await fetch(`${base}/ab-tests`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function updateAbTest(id: string, data: UpdateAbTestInput): Promise<AbTest> {
	return handle(
		await fetch(`${base}/ab-tests/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function fetchAnalytics(): Promise<UsageAnalytic[]> {
	return handle(await fetch(`${base}/analytics`));
}

export async function createAnalytics(
	data: Omit<UsageAnalytic, 'id' | 'userId' | 'createdAt'>
): Promise<UsageAnalytic> {
	return handle(
		await fetch(`${base}/analytics`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}

export async function fetchDeployments(promptId: string): Promise<PromptDeployment[]> {
	return handle(await fetch(`${base}/deployments?promptId=${promptId}`));
}

export async function createDeployment(data: {
	promptId: string;
	versionNumber: number;
	environmentLabel: string;
}): Promise<PromptDeployment> {
	return handle(
		await fetch(`${base}/deployments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
	);
}
