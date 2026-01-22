<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Send, Plus, Menu, SlidersHorizontal } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import {
		createPlaygroundSession,
		deletePlaygroundSession,
		fetchProviderModels,
		updatePlaygroundSession
	} from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import { sessionsStore } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/ai-knowledge.store';
	import {
		type PlaygroundSession,
		type Prompt
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { NativeSelect, NativeSelectOption } from '$lib/components/ui/native-select';
	import SessionSelector from '$lib/components/external_modules/MoLOS-AI-Knowledge/session-selector.svelte';
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
	let renamedSessionTitles: Record<string, string> = {};
	let editingSessionId = '';
	let renameDraft = '';
	let visibleSessions: PlaygroundSession[] = [];
	let messagesContainer: HTMLDivElement | null = null;
	let lastMessageCount = 0;
	let isSessionsOpen = false;
	let isSettingsOpen = false;
	let isPanelOpen = false;
	let pendingDeleteSession: PlaygroundSession | null = null;

	$: isPanelOpen = isSessionsOpen || isSettingsOpen;

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

	$: visibleSessions = sessions;

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
		await tick();
		scrollMessagesToBottom();
	});

	const scrollMessagesToBottom = () => {
		if (!messagesContainer) return;
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	};

	$: if (playgroundMessages.length !== lastMessageCount) {
		lastMessageCount = playgroundMessages.length;
		tick().then(scrollMessagesToBottom);
	}

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
		isSessionsOpen = false;
		isSettingsOpen = false;
		void tick().then(scrollMessagesToBottom);
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

	const requestDeleteSession = (session: PlaygroundSession) => {
		pendingDeleteSession = session;
		isSessionsOpen = false;
		isSettingsOpen = false;
	};

	const confirmDeleteSession = async () => {
		if (!pendingDeleteSession) return;
		const session = pendingDeleteSession;
		try {
			await deletePlaygroundSession(session.id);
			const nextSessions = sessions.filter((item) => item.id !== session.id);
			sessionsStore.set(nextSessions);
			if (selectedSessionId === session.id) {
				startNewConversation();
			}
			pendingDeleteSession = null;
			toast.success('Conversation deleted.');
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to delete conversation. Try again.'
			);
		}
	};

	const cancelDeleteSession = () => {
		pendingDeleteSession = null;
	};

	const selectSession = (session: PlaygroundSession) => {
		selectedSessionId = session.id;
		editingSessionId = '';
		playgroundError = '';
		isSending = false;
		isSessionsOpen = false;
		isSettingsOpen = false;
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
		void tick().then(scrollMessagesToBottom);
	};

	const promptLabel = (promptId: string | undefined) => {
		if (!promptId) return 'Ad-hoc';
		return prompts.find((prompt) => prompt.id === promptId)?.title ?? 'Unknown prompt';
	};
</script>

<div
	class="grid h-[100svh] w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-0 lg:h-full lg:grid-cols-[260px_minmax(0,1fr)_420px] lg:grid-rows-1 lg:rounded-2xl lg:border"
>
	{#if pendingDeleteSession}
		<Button
			variant="ghost"
			class="fixed inset-0 z-40 h-full w-full backdrop-blur-sm"
			type="button"
			aria-label="Close delete confirmation"
			onclick={cancelDeleteSession}
		></Button>
		<div
			class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-card p-5 shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-session-title"
			aria-describedby="delete-session-description"
		>
			<h3 id="delete-session-title" class="text-base font-semibold">
				Delete conversation?
			</h3>
			<p id="delete-session-description" class="mt-2 text-sm text-muted-foreground">
				This will remove "{sessionTitle(pendingDeleteSession)}" from your list.
			</p>
			<div class="mt-4 flex justify-end gap-2">
				<Button
					variant="outline"
					size="sm"
					class="rounded-md px-3 py-2 text-sm"
					type="button"
					onclick={cancelDeleteSession}
				>
					Cancel
				</Button>
				<Button
					variant="destructive"
					size="sm"
					class="rounded-md px-3 py-2 text-sm"
					type="button"
					onclick={confirmDeleteSession}
				>
					Delete
				</Button>
			</div>
		</div>
	{/if}
	{#if isPanelOpen}
		<Button
			variant="ghost"
			class="fixed inset-0 z-30 h-full w-full backdrop-blur-sm lg:hidden"
			type="button"
			aria-label="Close panels"
			onclick={() => {
				isSessionsOpen = false;
				isSettingsOpen = false;
			}}
		></Button>
	{/if}

	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-border/60 bg-card shadow-lg transition-transform duration-300 ease-out lg:static lg:z-0 lg:w-auto lg:translate-x-0 lg:rounded-l-2xl lg:rounded-r-none lg:rounded-t-2xl lg:shadow-none lg:border-r-0 {isSessionsOpen
			? 'translate-x-0'
			: '-translate-x-full lg:translate-x-0'}"
	>
		<div
			class="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
		>
			<h2 class="text-xs font-bold tracking-wider uppercase text-muted-foreground">Conversations</h2>
			<Button
				variant="outline"
				size="icon-sm"
				class="p-1 text-sm transition rounded-xl border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
				type="button"
				onclick={startNewConversation}
			>
				<Plus/>
			</Button>
		</div>
		<SessionSelector
			sessions={visibleSessions}
			{selectedSessionId}
			{editingSessionId}
			bind:renameDraft
			{sessionTitle}
			{startNewConversation}
			{selectSession}
			{beginRename}
			{cancelRename}
			{saveRename}
			{requestDeleteSession}
		/>
	</aside>

	<div class="flex min-h-0 flex-col rounded-none bg-card h-[90vh]">
		<div
			class="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 lg:hidden"
		>
			<div class="flex items-center gap-2 text-sm font-semibold">
				<Button
					variant="outline"
					size="icon"
					class="flex h-9 w-9 items-center justify-center rounded-full border-border/60 bg-background text-foreground transition hover:bg-muted"
					type="button"
					aria-label="Toggle conversations"
					aria-expanded={isSessionsOpen}
					onclick={() => {
						isSessionsOpen = !isSessionsOpen;
						if (isSessionsOpen) isSettingsOpen = false;
					}}
				>
					<Menu class="h-4 w-4" />
				</Button>
				<span>Playground</span>
			</div>
			<Button
				variant="outline"
				size="icon"
				class="flex h-9 w-9 items-center justify-center rounded-full border-border/60 bg-background text-foreground transition hover:bg-muted"
				type="button"
				aria-label="Toggle settings"
				aria-expanded={isSettingsOpen}
				onclick={() => {
					isSettingsOpen = !isSettingsOpen;
					if (isSettingsOpen) isSessionsOpen = false;
				}}
			>
				<SlidersHorizontal class="h-4 w-4" />
			</Button>
		</div>

		<div
			bind:this={messagesContainer}
			class="flex-1 min-h-0 space-y-4 overflow-y-auto bg-background/90 px-4 py-4 pr-3 sm:px-6 sm:py-6 sm:pr-4 lg:border lg:border-t-0 lg:border-b-0 lg:border-border/60"
		>
			{#if playgroundMessages.length === 0}
				<div
					class="p-6 text-sm border-dashed rounded-2xl border-border/50 bg-muted/20 text-muted-foreground"
				>
					No messages yet. Start chatting below.
				</div>
			{:else}
				{#each playgroundMessages as message, index (index)}
					<div class="p-4 text-sm rounded-2xl border-border/60 bg-background">
						<div class="text-xs uppercase text-muted-foreground">{message.role}</div>
						<div class="mt-1">{message.content}</div>
					</div>
				{/each}
			{/if}
		</div>

		<div class="px-4 py-4 sm:px-6 lg:border-t lg:border-border/60">
			<div class="relative left-0 w-full">
				<Textarea
					class="min-h-[120px] w-full rounded-2xl bg-background p-3 pb-12 text-sm sm:min-h-[140px]"
					bind:value={playgroundMessage}
					oninput={updateCostEstimate}
					onkeydown={(event) => {
						if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
							event.preventDefault();
							if (!isSending) sendPlaygroundMessage();
						}
					}}
					placeholder="Type a message to test the prompt"
				/>
				<div class="absolute bottom-3 left-3 flex items-center gap-3">
					<Button
						size="icon"
						class="inline-flex items-center justify-center w-10 h-10 transition rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
						aria-label="Send message"
						disabled={!canSendMessage}
						onclick={() => {
							sendPlaygroundMessage();
						}}
					>
						<Send class="w-4 h-4" />
					</Button>
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

	<aside
		class="fixed inset-y-0 right-0 z-40 flex min-h-0 w-80 flex-col border-l border-border/60 bg-card p-4 shadow-lg transition-transform duration-300 ease-out sm:p-6 lg:static lg:z-0 lg:w-auto lg:translate-x-0 lg:rounded-r-2xl lg:rounded-l-none lg:rounded-t-2xl lg:shadow-none lg:border-l-0 {isSettingsOpen
			? 'translate-x-0'
			: 'translate-x-full lg:translate-x-0'}"
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
				<div class="p-3 text-xs rounded-2xl border-destructive/40 bg-destructive/10 text-destructive">
					{playgroundError}
				</div>
			{/if}
			<div class="p-4 rounded-2xl bg-background/70">
				<div class="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
					Prompt, provider & model
				</div>
				<div class="grid gap-3 mt-3">
					<NativeSelect
						class="h-10 px-3 text-sm rounded-md bg-background"
						bind:value={playgroundPromptId}
					>
						<NativeSelectOption value="">Select saved prompt</NativeSelectOption>
						{#each prompts as prompt}
							<NativeSelectOption value={prompt.id}>{prompt.title}</NativeSelectOption>
						{/each}
					</NativeSelect>
					<NativeSelect
						class="h-10 px-3 text-sm rounded-md bg-background"
						bind:value={selectedModelId}
						onchange={updateCostEstimate}
					>
						{#each modelOptions as option}
							<NativeSelectOption value={option}>{option}</NativeSelectOption>
						{/each}
						<NativeSelectOption value="custom">Custom...</NativeSelectOption>
					</NativeSelect>
					{#if selectedModelId === 'custom'}
						<Input
							class="h-10 px-3 text-sm rounded-md bg-background"
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
						<Input
							class="w-full px-3 mt-2 rounded-md h-9 bg-background"
							type="number"
							bind:value={playgroundTokens}
							oninput={updateCostEstimate}
						/>
					</label>
				</div>
			</div>
			<div class="p-4 rounded-2xl bg-background/70">
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
			<div class="grid gap-2 p-4 text-xs rounded-2xl bg-muted/30 text-muted-foreground">
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
	</aside>
</div>
