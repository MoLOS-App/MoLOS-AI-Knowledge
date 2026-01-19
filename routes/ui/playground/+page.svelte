<script lang="ts">
	import { onMount } from 'svelte';
	import { Send , Plus} from 'lucide-svelte';
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
	let selectedSessionId = '';
	let selectedSession: PlaygroundSession | null = null;
	let deletedSessionIds = new Set<string>();
	let renamedSessionTitles: Record<string, string> = {};
	let editingSessionId = '';
	let renameDraft = '';
	let visibleSessions: PlaygroundSession[] = [];

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

	$: visibleSessions = sessions.filter((session) => !deletedSessionIds.has(session.id));

	$: selectedSession = selectedSessionId
		? visibleSessions.find((session) => session.id === selectedSessionId) ?? null
		: null;

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

	const startNewConversation = () => {
		selectedSessionId = '';
		editingSessionId = '';
		playgroundMessages = [];
		playgroundMessage = '';
		playgroundLatency = null;
		playgroundTokenEstimate = 0;
		playgroundCost = 0;
	};

	const sessionTitle = (session: PlaygroundSession) =>
		renamedSessionTitles[session.id] ?? promptLabel(session.promptId);

	const beginRename = (session: PlaygroundSession) => {
		editingSessionId = session.id;
		renameDraft = sessionTitle(session);
	};

	const saveRename = (session: PlaygroundSession) => {
		const nextTitle = renameDraft.trim() || promptLabel(session.promptId);
		renamedSessionTitles = { ...renamedSessionTitles, [session.id]: nextTitle };
		editingSessionId = '';
		renameDraft = '';
	};

	const cancelRename = () => {
		editingSessionId = '';
		renameDraft = '';
	};

	const deleteSession = (session: PlaygroundSession) => {
		const nextDeleted = new Set(deletedSessionIds);
		nextDeleted.add(session.id);
		deletedSessionIds = nextDeleted;
		if (selectedSessionId === session.id) {
			startNewConversation();
		}
	};

	const selectSession = (session: PlaygroundSession) => {
		selectedSessionId = session.id;
		editingSessionId = '';
		try {
			const parsed = JSON.parse(session.messagesJson || '[]');
			playgroundMessages = Array.isArray(parsed) ? parsed : [];
		} catch {
			playgroundMessages = [];
		}
		try {
			const parsedSettings = JSON.parse(session.settingsJson || '{}');
			playgroundTemp = parsedSettings.temperature ?? playgroundTemp;
			playgroundTokens = parsedSettings.maxTokens ?? playgroundTokens;
			playgroundTopP = parsedSettings.topP ?? playgroundTopP;
			playgroundFrequency = parsedSettings.frequencyPenalty ?? playgroundFrequency;
			playgroundPresence = parsedSettings.presencePenalty ?? playgroundPresence;
		} catch {
			// Ignore invalid settings payloads
		}
		if (session.model) {
			if (modelOptions.includes(session.model)) {
				selectedModelId = session.model;
				customModelId = '';
			} else {
				selectedModelId = 'custom';
				customModelId = session.model;
			}
		}
		playgroundPromptId = session.promptId ?? '';
		playgroundLatency = session.latencyMs ?? null;
		playgroundTokenEstimate = session.totalTokens ?? 0;
		playgroundCost = session.totalCost ?? 0;
		playgroundMessage = '';
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

<div
	class="grid h-full w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-4 sm:p-6 lg:grid-cols-[260px_minmax(0,1fr)_420px] lg:grid-rows-1"
>
	<div
		class="flex flex-col min-h-0 border rounded-b-none rounded-t-2xl bg-card lg:rounded-l-2xl lg:rounded-r-none lg:rounded-t-2xl"
	>
		<div
			class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border/60"
		>
			<h2 class="text-xs font-bold tracking-wider uppercase text-muted-foreground">Conversations</h2>
			<button
				class="p-1 text-sm transition border rounded-xl border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
				type="button"
				onclick={startNewConversation}
			>
				<Plus/>
			</button>
		</div>
		<div class="flex flex-col flex-1 gap-3 px-4 py-4 pr-3 overflow-y-auto">
			<div
				class={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
					!selectedSessionId
						? 'border-primary bg-primary/5'
						: 'border-border/40 bg-background/70 hover:border-border/70 hover:bg-muted/30'
				}`}
			>
				<button class="w-full text-left" type="button" onclick={startNewConversation}>
					<div class="font-semibold">New conversation</div>
					<div class="text-xs text-muted-foreground">Start from scratch</div>
				</button>
			</div>
			{#each visibleSessions as session}
				<div
					class={`rounded-2xl border px-4 py-3 transition-all ${
						selectedSessionId === session.id
							? 'border-primary bg-primary/5'
							: 'border-border/40 bg-background/70 hover:border-border/70 hover:bg-muted/30'
					}`}
				>
					<div class="flex items-start justify-between gap-2">
						{#if editingSessionId === session.id}
							<div class="flex-1 min-w-0">
								<input
									class="w-full h-8 px-2 text-sm border rounded-md bg-background"
									bind:value={renameDraft}
								/>
								<div class="mt-1 text-xs text-muted-foreground">
									{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
								</div>
							</div>
						{:else}
							<button
								class="flex-1 min-w-0 text-left"
								type="button"
								onclick={() => selectSession(session)}
							>
								<div class="text-sm font-semibold truncate">{sessionTitle(session)}</div>
								<div class="mt-1 text-xs text-muted-foreground">
									{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
								</div>
							</button>
						{/if}
						<div class="flex shrink-0 flex-col gap-2 text-[11px] text-muted-foreground">
							{#if editingSessionId === session.id}
								<button
									class="px-2 py-1 border rounded-md text-foreground"
									type="button"
									onclick={() => saveRename(session)}
								>
									Save
								</button>
								<button
									class="px-2 py-1 border rounded-md"
									type="button"
									onclick={cancelRename}
								>
									Cancel
								</button>
							{:else}
								<button
									class="px-2 py-1 border rounded-md"
									type="button"
									onclick={() => beginRename(session)}
								>
									Rename
								</button>
								<button
									class="px-2 py-1 border rounded-md text-destructive"
									type="button"
									onclick={() => deleteSession(session)}
								>
									Delete
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
			{#if visibleSessions.length === 0}
				<div
					class="px-4 py-6 text-sm text-center border border-dashed rounded-2xl border-border/50 bg-muted/20 text-muted-foreground"
				>
					No conversations yet.
					<div class="mt-1 text-xs text-muted-foreground/60">Start one to see it here.</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex flex-col min-h-0 border rounded-none bg-card">

		<div class="flex-1 min-h-0 px-6 py-6 pr-4 space-y-4 overflow-y-auto bg-background/90">
			{#if playgroundMessages.length === 0}
				<div
					class="p-6 text-sm border border-dashed rounded-2xl border-border/50 bg-muted/20 text-muted-foreground"
				>
					No messages yet. Start chatting below.
				</div>
			{:else}
				{#each playgroundMessages as message, index (index)}
					<div class="p-4 text-sm border rounded-2xl border-border/60 bg-background">
						<div class="text-xs uppercase text-muted-foreground">{message.role}</div>
						<div class="mt-1">{message.content}</div>
					</div>
				{/each}
			{/if}
		</div>

		<div class="px-6 py-4 border-t border-border/60">
			<div class="relative left-0 w-full">
				<textarea
					class="min-h-[140px] w-full rounded-2xl border bg-background p-3 pb-12 text-sm"
					bind:value={playgroundMessage}
					oninput={updateCostEstimate}
					onkeydown={(event) => {
						if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
							event.preventDefault();
							sendPlaygroundMessage();
						}
					}}
					placeholder="Type a message to test the prompt"
				></textarea>
				<div class="absolute flex items-center gap-3 bottom-3 left-3">
					<button
						class="inline-flex items-center justify-center w-10 h-10 transition rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
						aria-label="Send message"
						onclick={sendPlaygroundMessage}
					>
						<Send class="w-4 h-4" />
					</button>
					<div class="text-xs text-muted-foreground">Ctrl+enter to send.</div>
				</div>
			</div>
		</div>

	</div>

	<div
		class="flex flex-col min-h-0 p-6 border rounded-t-none rounded-b-2xl bg-card lg:rounded-r-2xl lg:rounded-l-none lg:rounded-t-2xl"
	>
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold">Model & settings</h3>
			<div class="text-xs text-muted-foreground">Tuning controls</div>
		</div>
		<div class="flex flex-col flex-1 min-h-0 mt-4 space-y-4 overflow-auto">
			<div class="grid gap-3">
				<select class="h-10 px-3 text-sm border rounded-md bg-background" bind:value={playgroundPromptId}>
					<option value="">Select saved prompt</option>
					{#each prompts as prompt}
						<option value={prompt.id}>{prompt.title}</option>
					{/each}
				</select>
				<div class="flex items-center h-10 px-3 text-sm border rounded-md bg-muted/30 text-muted-foreground">
					Provider: {providerLabels[provider] ?? provider}
				</div>
			</div>
			<div class="grid gap-3">
				<select
					class="h-10 px-3 text-sm border rounded-md bg-background"
					bind:value={selectedModelId}
					onchange={updateCostEstimate}
				>
					{#each modelOptions as option}
						<option value={option}>{option}</option>
					{/each}
					<option value="custom">Custom...</option>
				</select>
				<div class="flex items-center h-10 px-3 text-xs border rounded-md bg-muted/30 text-muted-foreground">
					Models loaded from settings / API
				</div>
			</div>
			{#if selectedModelId === 'custom'}
				<div class="grid gap-3">
					<input
						class="h-10 px-3 text-sm border rounded-md bg-background"
						bind:value={customModelId}
						oninput={updateCostEstimate}
						placeholder="Enter custom model id"
					/>
					<div class="flex items-center h-10 px-3 text-xs border rounded-md bg-muted/30 text-muted-foreground">
						Custom model id is stored with the session
					</div>
				</div>
			{/if}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
				<label class="text-xs text-muted-foreground">
					Temp
					<input
						class="w-full px-3 mt-1 border rounded-md h-9 bg-background"
						type="number"
						step="0.1"
						bind:value={playgroundTemp}
					/>
					</label>
				<label class="text-xs text-muted-foreground">
					Max tokens
					<input
						class="w-full px-3 mt-1 border rounded-md h-9 bg-background"
						type="number"
						bind:value={playgroundTokens}
						oninput={updateCostEstimate}
					/>
					</label>
				<label class="text-xs text-muted-foreground">
					Top P
					<input
						class="w-full px-3 mt-1 border rounded-md h-9 bg-background"
						type="number"
						step="0.1"
						bind:value={playgroundTopP}
					/>
				</label>
			</div>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
				<label class="text-xs text-muted-foreground">
					Frequency penalty
					<input
						class="w-full px-3 mt-1 border rounded-md h-9 bg-background"
						type="number"
						step="0.1"
						bind:value={playgroundFrequency}
					/>
				</label>
				<label class="text-xs text-muted-foreground">
					Presence penalty
					<input
						class="w-full px-3 mt-1 border rounded-md h-9 bg-background"
						type="number"
						step="0.1"
						bind:value={playgroundPresence}
					/>
				</label>
			</div>
			<div class="p-3 text-xs border rounded-xl bg-muted/30 text-muted-foreground">
				<div>Tokens: {playgroundTokenEstimate}</div>
				<div>Estimated cost: ${playgroundCost}</div>
				<div>Latency: {playgroundLatency ? `${playgroundLatency}ms` : '—'}</div>
			</div>
		</div>
	</div>
</div>
