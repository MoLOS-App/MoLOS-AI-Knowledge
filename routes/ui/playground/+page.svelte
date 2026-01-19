<script lang="ts">
	import { onMount } from 'svelte';
	import { Send , Plus} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import {
		createPlaygroundSession,
		fetchProviderModels,
		updatePlaygroundSession
	} from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import { sessionsStore } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/ai-knowledge.store';
	import {
		type PlaygroundSession,
		type Prompt
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import type { PageData } from './$types';

	export let data: PageData;

	let prompts: Prompt[] = [];
	let sessions: PlaygroundSession[] = [];
	let initialSessions: PlaygroundSession[] = [];
	let models: string[] = [];
	let settings: PageData['settings'] = null;
	let provider = 'openai';

	$: ({ prompts, sessions: initialSessions, models, settings } = data);
	$: provider = settings?.provider ?? 'openai';
	$: sessions = $sessionsStore;

	const providerLabels: Record<string, string> = {
		openai: 'OpenAI',
		openrouter: 'OpenRouter',
		anthropic: 'Anthropic',
		xai: 'xAI'
	};
	const sendGuardToastId = 'ai-knowledge-playground-send-guard';

	let modelOptions: string[] = [];

	let playgroundPromptId = '';
	let playgroundModel = 'gpt-4';
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
	let playgroundError = '';
	let isSending = false;
	let selectedSessionId = '';
	let selectedSession: PlaygroundSession | null = null;
	let deletedSessionIds = new Set<string>();
	let renamedSessionTitles: Record<string, string> = {};
	let editingSessionId = '';
	let renameDraft = '';
	let visibleSessions: PlaygroundSession[] = [];

	const defaultModels = [
		'gpt-4',
		'gpt-4-turbo',
		'claude-sonnet-4-5',
		'claude-haiku-4-5',
		'gemini-pro'
	];
	const pricing: Record<string, { input: number; output: number }> = {
		'gpt-4': { input: 0.03, output: 0.06 },
		'gpt-4-turbo': { input: 0.01, output: 0.03 },
		'claude-sonnet-4-5': { input: 0.008, output: 0.024 },
		'claude-haiku-4-5': { input: 0.002, output: 0.006 },
		'gemini-pro': { input: 0.0025, output: 0.005 }
	};
	const allowedModelTargets = new Set(defaultModels);
	const normalizeModelForStorage = (model: string) =>
		allowedModelTargets.has(model) ? model : 'gpt-4';

	const estimateTokens = (text: string) => Math.ceil(text.split(/\s+/).length / 0.75);
	const estimateConversationTokens = (messages: { content: string }[]) =>
		estimateTokens(messages.map((message) => message.content).join(' '));

	$: {
		const preconfigured = settings?.preconfiguredModels ?? [];
		modelOptions = preconfigured.length ? preconfigured : models.length ? models : defaultModels;
	}

	$: {
		if (selectedModelId !== 'custom' && !modelOptions.includes(selectedModelId)) {
			selectedModelId = modelOptions[0] ?? 'custom';
		}
	}

	$: {
		const fallbackModel = modelOptions[0] ?? 'gpt-4';
		playgroundModel =
			selectedModelId === 'custom' ? customModelId.trim() || fallbackModel : selectedModelId;
	}

	$: visibleSessions = sessions.filter((session) => !deletedSessionIds.has(session.id));

	$: selectedSession = selectedSessionId
		? visibleSessions.find((session) => session.id === selectedSessionId) ?? null
		: null;

	$: requiresPrompt = prompts.length > 0;
	$: canSendMessage =
		!!provider &&
		!!playgroundModel &&
		(!requiresPrompt || !!playgroundPromptId) &&
		!!playgroundMessage.trim() &&
		!isSending;

	onMount(async () => {
		if (sessions.length === 0) {
			sessionsStore.set(initialSessions ?? []);
		}
		try {
			const result = await fetchProviderModels(provider);
			models = result.models;
		} catch {
			models = models.length ? models : defaultModels;
		}
	});

	const updateCostEstimate = (text = playgroundMessage) => {
		const tokens = estimateTokens(text);
		playgroundTokenEstimate = tokens;
		const rate = pricing[playgroundModel] ?? pricing['gpt-4'];
		const inputCost = (tokens / 1000) * rate.input;
		const outputCost = (playgroundTokens / 1000) * rate.output;
		playgroundCost = Number((inputCost + outputCost).toFixed(4));
	};

	const updateTotalsFromUsage = (
		usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } | undefined,
		inputMessages: { content: string }[],
		assistantContent: string
	) => {
		const rate = pricing[playgroundModel] ?? pricing['gpt-4'];
		const inputTokens = usage?.inputTokens ?? estimateConversationTokens(inputMessages);
		const outputTokens = usage?.outputTokens ?? estimateTokens(assistantContent);
		const totalTokens = usage?.totalTokens ?? inputTokens + outputTokens;
		playgroundTokenEstimate = totalTokens;
		const inputCost = (inputTokens / 1000) * rate.input;
		const outputCost = (outputTokens / 1000) * rate.output;
		playgroundCost = Number((inputCost + outputCost).toFixed(4));
	};

	const persistPlaygroundSession = async () => {
		const customModelValue = customModelId.trim();
		const settingsPayload = {
			temperature: playgroundTemp,
			maxTokens: playgroundTokens,
			topP: playgroundTopP,
			frequencyPenalty: playgroundFrequency,
			presencePenalty: playgroundPresence,
			modelId: selectedModelId,
			customModelId: customModelValue || undefined
		};
		const payload = {
			promptId: playgroundPromptId || undefined,
			model: normalizeModelForStorage(playgroundModel),
			settingsJson: JSON.stringify(settingsPayload),
			messagesJson: JSON.stringify(playgroundMessages),
			totalTokens: playgroundTokenEstimate,
			totalCost: playgroundCost,
			latencyMs: playgroundLatency ?? undefined
		};

		let saved: PlaygroundSession;
		if (selectedSessionId) {
			saved = await updatePlaygroundSession(selectedSessionId, payload);
		} else {
			saved = await createPlaygroundSession(payload);
			selectedSessionId = saved.id;
		}

		const nextSessions = [saved, ...sessions.filter((session) => session.id !== saved.id)];
		sessionsStore.set(nextSessions);
	};

	const sendPlaygroundMessage = async () => {
		if (!provider || !playgroundModel || (requiresPrompt && !playgroundPromptId)) {
			toast.warning('Select a provider, model, and prompt before sending a message.', {
				id: sendGuardToastId
			});
			return;
		}
		if (!playgroundMessage.trim() || isSending) return;
		const now = Date.now();
		const userMessage = playgroundMessage.trim();
		const nextMessages = [
			...playgroundMessages,
			{ role: 'user', content: userMessage, createdAt: now }
		];
		playgroundMessages = nextMessages;
		playgroundMessage = '';
		playgroundError = '';
		isSending = true;
		updateCostEstimate(userMessage);
		void persistPlaygroundSession().catch((err) => {
			playgroundError = err instanceof Error ? err.message : 'Failed to save conversation.';
		});

		try {
			const res = await fetch('/api/MoLOS-AI-Knowledge/playground', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					promptId: playgroundPromptId || undefined,
					model: playgroundModel,
					messages: nextMessages.map((message) => ({
						role: message.role,
						content: message.content
					})),
					settings: {
						temperature: playgroundTemp,
						maxTokens: playgroundTokens,
						topP: playgroundTopP,
						frequencyPenalty: playgroundFrequency,
						presencePenalty: playgroundPresence
					}
				})
			});

			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || 'Failed to reach provider.');
			}

			const data = (await res.json()) as {
				message: string;
				latencyMs?: number;
				usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
			};
			const assistantMessage = {
				role: 'assistant',
				content: data.message || '',
				createdAt: Date.now()
			};
			playgroundMessages = [...nextMessages, assistantMessage];
			playgroundLatency = data.latencyMs ?? null;
			updateTotalsFromUsage(data.usage, nextMessages, assistantMessage.content);
			await persistPlaygroundSession();
		} catch (err) {
			playgroundError = err instanceof Error ? err.message : 'Failed to reach provider.';
		} finally {
			isSending = false;
		}
	};

	const startNewConversation = () => {
		selectedSessionId = '';
		editingSessionId = '';
		playgroundMessages = [];
		playgroundMessage = '';
		playgroundLatency = null;
		playgroundTokenEstimate = 0;
		playgroundCost = 0;
		playgroundError = '';
		isSending = false;
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
		playgroundError = '';
		isSending = false;
		try {
			const parsed = JSON.parse(session.messagesJson || '[]');
			playgroundMessages = Array.isArray(parsed) ? parsed : [];
		} catch {
			playgroundMessages = [];
		}
		let parsedSettings: Record<string, unknown> = {};
		try {
			parsedSettings = JSON.parse(session.settingsJson || '{}');
			playgroundTemp =
				typeof parsedSettings.temperature === 'number'
					? parsedSettings.temperature
					: playgroundTemp;
			playgroundTokens =
				typeof parsedSettings.maxTokens === 'number'
					? parsedSettings.maxTokens
					: playgroundTokens;
			playgroundTopP =
				typeof parsedSettings.topP === 'number' ? parsedSettings.topP : playgroundTopP;
			playgroundFrequency =
				typeof parsedSettings.frequencyPenalty === 'number'
					? parsedSettings.frequencyPenalty
					: playgroundFrequency;
			playgroundPresence =
				typeof parsedSettings.presencePenalty === 'number'
					? parsedSettings.presencePenalty
					: playgroundPresence;
		} catch {
			// Ignore invalid settings payloads
		}
		const storedModelId =
			typeof parsedSettings.modelId === 'string' ? parsedSettings.modelId : '';
		const storedCustomModelId =
			typeof parsedSettings.customModelId === 'string' ? parsedSettings.customModelId : '';
		if (storedModelId) {
			if (storedModelId === 'custom') {
				selectedModelId = 'custom';
				customModelId = storedCustomModelId;
			} else if (modelOptions.includes(storedModelId)) {
				selectedModelId = storedModelId;
				customModelId = '';
			} else {
				selectedModelId = 'custom';
				customModelId = storedModelId;
			}
		} else if (session.model) {
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
							if (!isSending) sendPlaygroundMessage();
						}
					}}
					placeholder="Type a message to test the prompt"
				></textarea>
				<div class="absolute flex items-center gap-3 bottom-3 left-3">
					<button
						class="inline-flex items-center justify-center w-10 h-10 transition rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						aria-label="Send message"
						disabled={!canSendMessage}
						onclick={() => {
							sendPlaygroundMessage();
						}}
					>
						<Send class="w-4 h-4" />
					</button>
					<div class="text-xs text-muted-foreground">
						{isSending
							? 'Sending…'
							: !provider || !playgroundModel || (requiresPrompt && !playgroundPromptId)
								? 'Select provider, model, and prompt to send.'
								: 'Ctrl+enter to send.'}
					</div>
				</div>
			</div>
		</div>

	</div>

	<div
		class="flex flex-col min-h-0 p-6 border rounded-t-none rounded-b-2xl bg-card lg:rounded-r-2xl lg:rounded-l-none lg:rounded-t-2xl"
	>
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold">Model & settings</h3>
				<div class="text-xs text-muted-foreground">Tune the run before you send</div>
			</div>
			<div class="text-[11px] text-muted-foreground">Live estimate</div>
		</div>
		<div class="flex flex-col flex-1 min-h-0 mt-4 space-y-4 overflow-auto">
			{#if playgroundError}
				<div class="p-3 text-xs border rounded-2xl border-destructive/40 bg-destructive/10 text-destructive">
					{playgroundError}
				</div>
			{/if}
			<div class="p-4 border rounded-2xl bg-background/70">
				<div class="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
					Prompt, provider & model
				</div>
				<div class="grid gap-3 mt-3">
					<select class="h-10 px-3 text-sm border rounded-md bg-background" bind:value={playgroundPromptId}>
						<option value="">Select saved prompt</option>
						{#each prompts as prompt}
							<option value={prompt.id}>{prompt.title}</option>
						{/each}
					</select>
					<div class="flex items-center h-10 px-3 text-sm border rounded-md bg-muted/30 text-muted-foreground">
						Provider: {providerLabels[provider] ?? provider}
					</div>
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
					{#if selectedModelId === 'custom'}
						<input
							class="h-10 px-3 text-sm border rounded-md bg-background"
							bind:value={customModelId}
							oninput={updateCostEstimate}
							placeholder="Enter custom model id"
						/>
						<div class="text-[11px] text-muted-foreground">
							Stored with the session for recall.
						</div>
					{:else}
						<div class="text-[11px] text-muted-foreground">
							Models loaded from settings / API
						</div>
					{/if}
					<label class="text-xs text-muted-foreground">
						Max tokens
						<input
							class="w-full px-3 mt-2 border rounded-md h-9 bg-background"
							type="number"
							bind:value={playgroundTokens}
							oninput={updateCostEstimate}
						/>
					</label>
				</div>
			</div>
			<div class="p-4 border rounded-2xl bg-background/70">
				<div class="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
					Parameters
				</div>
				<div class="grid gap-4 mt-4">
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
						<label class="text-xs text-muted-foreground">
							<div class="flex items-center justify-between">
								<span>Temp</span>
								<span class="text-[11px] text-foreground">{playgroundTemp}</span>
							</div>
							<input
								class="w-full mt-2"
								type="range"
								min="0"
								max="2"
								step="0.1"
								bind:value={playgroundTemp}
							/>
						</label>
						<label class="text-xs text-muted-foreground">
							<div class="flex items-center justify-between">
								<span>Top P</span>
								<span class="text-[11px] text-foreground">{playgroundTopP}</span>
							</div>
							<input
								class="w-full mt-2"
								type="range"
								min="0"
								max="1"
								step="0.05"
								bind:value={playgroundTopP}
							/>
						</label>
					</div>
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
						<label class="text-xs text-muted-foreground">
							<div class="flex items-center justify-between">
								<span>Frequency penalty</span>
								<span class="text-[11px] text-foreground">{playgroundFrequency}</span>
							</div>
							<input
								class="w-full mt-2"
								type="range"
								min="-2"
								max="2"
								step="0.1"
								bind:value={playgroundFrequency}
							/>
						</label>
						<label class="text-xs text-muted-foreground">
							<div class="flex items-center justify-between">
								<span>Presence penalty</span>
								<span class="text-[11px] text-foreground">{playgroundPresence}</span>
							</div>
							<input
								class="w-full mt-2"
								type="range"
								min="-2"
								max="2"
								step="0.1"
								bind:value={playgroundPresence}
							/>
						</label>
					</div>
				</div>
			</div>
			<div class="grid gap-2 p-4 text-xs border rounded-2xl bg-muted/30 text-muted-foreground">
				<div class="flex items-center justify-between">
					<span>Tokens</span>
					<span class="text-foreground">{playgroundTokenEstimate}</span>
				</div>
				<div class="flex items-center justify-between">
					<span>Estimated cost</span>
					<span class="text-foreground">${playgroundCost}</span>
				</div>
				<div class="flex items-center justify-between">
					<span>Latency</span>
					<span class="text-foreground">
						{playgroundLatency ? `${playgroundLatency}ms` : '—'}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
