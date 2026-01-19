<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import {
		createPlaygroundSession,
		fetchProviderModels
	} from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import {
		ModelTarget,
		type PlaygroundSession,
		type Prompt
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import type { PageData } from './$types';

	export let data: PageData;

	let prompts: Prompt[] = [];
	let sessions: PlaygroundSession[] = [];
	let models: string[] = [];
	let settings: PageData['settings'] = null;
	let provider = 'openai';

	$: ({ prompts, sessions, models, settings } = data);
	$: provider = settings?.provider ?? 'openai';

	const providerLabels: Record<string, string> = {
		openai: 'OpenAI',
		openrouter: 'OpenRouter',
		anthropic: 'Anthropic',
		xai: 'xAI'
	};

	let modelOptions: string[] = [];

	let playgroundPromptId = '';
	let playgroundModel = ModelTarget.GPT_4;
	let selectedModelId = 'custom';
	let customModelId = '';
	let playgroundTemp = 0.7;
	let playgroundTokens = 512;
	let playgroundTopP = 1;
	let playgroundFrequency = 0;
	let playgroundPresence = 0;
	let playgroundMessage = '';
	let playgroundMessages: { role: string; content: string; createdAt: number }[] = [];
	let playgroundLatency: number | null = null;
	let playgroundCost = 0;
	let playgroundTokenEstimate = 0;

	const pricing: Record<string, { input: number; output: number }> = {
		[ModelTarget.GPT_4]: { input: 0.03, output: 0.06 },
		[ModelTarget.GPT_4_TURBO]: { input: 0.01, output: 0.03 },
		[ModelTarget.CLAUDE_SONNET]: { input: 0.008, output: 0.024 },
		[ModelTarget.CLAUDE_HAIKU]: { input: 0.002, output: 0.006 },
		[ModelTarget.GEMINI_PRO]: { input: 0.0025, output: 0.005 }
	};

	const estimateTokens = (text: string) => Math.ceil(text.split(/\s+/).length / 0.75);

	$: {
		const preconfigured = settings?.preconfiguredModels ?? [];
		modelOptions = preconfigured.length ? preconfigured : models.length ? models : Object.values(ModelTarget);
	}

	$: {
		if (selectedModelId !== 'custom' && !modelOptions.includes(selectedModelId)) {
			selectedModelId = modelOptions[0] ?? 'custom';
		}
	}

	$: {
		const fallbackModel = modelOptions[0] ?? ModelTarget.GPT_4;
		playgroundModel =
			selectedModelId === 'custom' ? customModelId.trim() || fallbackModel : selectedModelId;
	}

	onMount(async () => {
		try {
			const result = await fetchProviderModels(provider);
			models = result.models;
		} catch {
			models = models.length ? models : Object.values(ModelTarget);
		}
	});

	const updateCostEstimate = () => {
		const tokens = estimateTokens(playgroundMessage);
		playgroundTokenEstimate = tokens;
		const rate = pricing[playgroundModel] ?? pricing[ModelTarget.GPT_4];
		const inputCost = (tokens / 1000) * rate.input;
		const outputCost = (playgroundTokens / 1000) * rate.output;
		playgroundCost = Number((inputCost + outputCost).toFixed(4));
	};

	const sendPlaygroundMessage = () => {
		if (!playgroundMessage.trim()) return;
		const now = Date.now();
		playgroundMessages = [
			...playgroundMessages,
			{ role: 'user', content: playgroundMessage.trim(), createdAt: now }
		];
		const response = `Draft response for ${playgroundModel}: ${playgroundMessage.trim()}`;
		playgroundMessages = [
			...playgroundMessages,
			{ role: 'assistant', content: response, createdAt: now + 1 }
		];
		playgroundLatency = Math.floor(Math.random() * 400) + 120;
		playgroundMessage = '';
		updateCostEstimate();
	};

	const savePlaygroundSession = async () => {
		const payload = {
			promptId: playgroundPromptId || undefined,
			model: playgroundModel,
			settingsJson: JSON.stringify({
				temperature: playgroundTemp,
				maxTokens: playgroundTokens,
				topP: playgroundTopP,
				frequencyPenalty: playgroundFrequency,
				presencePenalty: playgroundPresence
			}),
			messagesJson: JSON.stringify(playgroundMessages),
			totalTokens: playgroundTokenEstimate,
			totalCost: playgroundCost,
			latencyMs: playgroundLatency ?? undefined
		};

		await createPlaygroundSession(payload);
		await invalidateAll();
	};

	const promptLabel = (promptId: string | undefined) => {
		if (!promptId) return 'Ad-hoc';
		return prompts.find((prompt) => prompt.id === promptId)?.title ?? 'Unknown prompt';
	};
</script>

<div class="space-y-6">
	<section class="rounded-2xl border bg-card p-6">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">Playground</h2>
				<p class="text-sm text-muted-foreground">
					Prototype prompt runs, tune settings, and save sessions.
				</p>
			</div>
			<div class="text-xs text-muted-foreground">Cost estimates update as you type.</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
		<div class="rounded-2xl border bg-card p-6">
			<div class="space-y-4">
				<div class="grid gap-3 md:grid-cols-2">
					<select class="h-10 rounded-md border bg-background px-3 text-sm" bind:value={playgroundPromptId}>
						<option value="">Select saved prompt</option>
						{#each prompts as prompt}
							<option value={prompt.id}>{prompt.title}</option>
						{/each}
					</select>
					<div class="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
						Provider: {providerLabels[provider] ?? provider}
					</div>
				</div>
				<div class="grid gap-3 md:grid-cols-2">
					<select
						class="h-10 rounded-md border bg-background px-3 text-sm"
						bind:value={selectedModelId}
						onchange={updateCostEstimate}
					>
						{#each modelOptions as option}
							<option value={option}>{option}</option>
						{/each}
						<option value="custom">Custom...</option>
					</select>
					<div class="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-xs text-muted-foreground">
						Models loaded from settings / API
					</div>
				</div>
				{#if selectedModelId === 'custom'}
					<div class="grid gap-3 md:grid-cols-2">
						<input
							class="h-10 rounded-md border bg-background px-3 text-sm"
							bind:value={customModelId}
							oninput={updateCostEstimate}
							placeholder="Enter custom model id"
						/>
						<div class="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-xs text-muted-foreground">
							Custom model id is stored with the session
						</div>
					</div>
				{/if}
				<div class="grid gap-3 md:grid-cols-3">
					<label class="text-xs text-muted-foreground">
						Temp
						<input
							class="mt-1 h-9 w-full rounded-md border bg-background px-3"
							type="number"
							step="0.1"
							bind:value={playgroundTemp}
						/>
					</label>
					<label class="text-xs text-muted-foreground">
						Max tokens
						<input
							class="mt-1 h-9 w-full rounded-md border bg-background px-3"
							type="number"
							bind:value={playgroundTokens}
							oninput={updateCostEstimate}
						/>
					</label>
					<label class="text-xs text-muted-foreground">
						Top P
						<input
							class="mt-1 h-9 w-full rounded-md border bg-background px-3"
							type="number"
							step="0.1"
							bind:value={playgroundTopP}
						/>
					</label>
				</div>
				<div class="grid gap-3 md:grid-cols-2">
					<label class="text-xs text-muted-foreground">
						Frequency penalty
						<input
							class="mt-1 h-9 w-full rounded-md border bg-background px-3"
							type="number"
							step="0.1"
							bind:value={playgroundFrequency}
						/>
					</label>
					<label class="text-xs text-muted-foreground">
						Presence penalty
						<input
							class="mt-1 h-9 w-full rounded-md border bg-background px-3"
							type="number"
							step="0.1"
							bind:value={playgroundPresence}
						/>
					</label>
				</div>
				<textarea
					class="min-h-[120px] rounded-md border bg-background p-3 text-sm"
					bind:value={playgroundMessage}
					oninput={updateCostEstimate}
					placeholder="Type a message to test the prompt"
				></textarea>
				<div class="flex flex-wrap items-center gap-3 text-sm">
					<button
						class="rounded-md bg-primary px-4 py-2 text-primary-foreground"
						onclick={sendPlaygroundMessage}
					>
						Send message
					</button>
					<button
						class="rounded-md border px-4 py-2"
						onclick={() => (playgroundMessages = [])}
					>
						Clear
					</button>
					<button class="rounded-md border px-4 py-2" onclick={savePlaygroundSession}>
						Save session
					</button>
				</div>
				<div class="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
					Tokens: {playgroundTokenEstimate} • Estimated cost: ${playgroundCost} • Latency:{' '}
					{playgroundLatency ? `${playgroundLatency}ms` : '—'}
				</div>
			</div>
		</div>
		<div class="space-y-6">
			<div class="rounded-2xl border bg-card p-6">
				<h3 class="text-lg font-semibold">Conversation</h3>
				{#if playgroundMessages.length === 0}
					<div class="mt-4 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No messages yet. Start a test on the left.
					</div>
				{:else}
					<div class="mt-4 space-y-3">
						{#each playgroundMessages as message, index (index)}
							<div class="rounded-xl border p-3 text-sm">
								<div class="text-xs uppercase text-muted-foreground">{message.role}</div>
								<div class="mt-1">{message.content}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			<div class="rounded-2xl border bg-card p-6">
				<h3 class="text-lg font-semibold">Session History</h3>
				<div class="mt-4 space-y-3">
					{#each sessions as session}
						<div class="rounded-xl border p-3">
							<div class="text-sm font-semibold">{promptLabel(session.promptId)}</div>
							<div class="text-xs text-muted-foreground">
								{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
							</div>
						</div>
					{/each}
					{#if sessions.length === 0}
						<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
							No sessions saved yet.
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>
</div>
