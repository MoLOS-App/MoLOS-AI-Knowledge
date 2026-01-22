<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { deleteHumanizerJob } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import { Copy, Loader2, Trash2 } from 'lucide-svelte';
	import {
		HumanizationLevel,
		HumanizationTone,
		type HumanizationLevel as HumanizationLevelType,
		type HumanizationTone as HumanizationToneType,
		type HumanizerJob
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import type { PageData } from './$types';

	export let data: PageData;

	let jobs: HumanizerJob[] = [];
	let models: string[] = [];
	let settings: PageData['settings'] = null;
	$: ({ jobs, models, settings } = data);

	const levelOptions = Object.values(HumanizationLevel);
	const toneOptions = Object.values(HumanizationTone);

	let humanizerInput = '';
	let humanizerOutput = '';
	let humanizerLevel: HumanizationLevelType = HumanizationLevel.MEDIUM;
	let humanizerTone: HumanizationToneType = HumanizationTone.CONVERSATIONAL;
	let humanizerScore = 0;
	let humanizerModel = '';
	let selectedModelId = '';
	let customModelId = '';
	let maxTokens = 512;
	let temperature = 1.0;
	let topP = 1.0;
	let frequencyPenalty = 0.4;
	let presencePenalty = 0.0;
	let isHumanizing = false;
	let humanizerError = '';
	let didCopy = false;
	let pendingDeleteJob: HumanizerJob | null = null;

	const countWords = (text: string) =>
		text
			.trim()
			.split(/\s+/)
			.filter(Boolean).length;

	$: inputWords = countWords(humanizerInput);
	$: outputWords = countWords(humanizerOutput);

	const defaultModels = [
		'gpt-4',
		'gpt-4-turbo',
		'claude-sonnet-4-5',
		'claude-haiku-4-5',
		'gemini-pro'
	];

	let modelOptions: string[] = [];
	$: {
		const preconfigured = settings?.preconfiguredModels ?? [];
		modelOptions = preconfigured.length ? preconfigured : models.length ? models : defaultModels;
	}

	$: {
		if (!selectedModelId || (selectedModelId !== 'custom' && !modelOptions.includes(selectedModelId))) {
			selectedModelId = modelOptions[0] ?? 'custom';
		}
	}

	$: {
		const fallbackModel = modelOptions[0] ?? 'gpt-4';
		humanizerModel =
			selectedModelId === 'custom' ? customModelId.trim() || fallbackModel : selectedModelId;
	}

	const clearInput = () => {
		humanizerInput = '';
		humanizerOutput = '';
		humanizerScore = 0;
		humanizerError = '';
	};

	const copyOutput = async () => {
		if (!humanizerOutput.trim() || !navigator?.clipboard) return;
		await navigator.clipboard.writeText(humanizerOutput);
		didCopy = true;
		setTimeout(() => {
			didCopy = false;
		}, 1800);
	};

	const startDeleteJob = (job: HumanizerJob) => {
		pendingDeleteJob = job;
	};

	const cancelDeleteJob = () => {
		pendingDeleteJob = null;
	};

	const confirmDeleteJob = async () => {
		if (!pendingDeleteJob) return;
		await deleteHumanizerJob(pendingDeleteJob.id);
		pendingDeleteJob = null;
		await invalidateAll();
	};

	const loadJob = (job: HumanizerJob) => {
		humanizerInput = job.inputText;
		humanizerOutput = job.outputText ?? '';
		humanizerLevel = job.level;
		humanizerTone = job.tone;
		humanizerScore = job.confidenceScore;
	};
</script>

<div class="space-y-8 lg:h-full lg:min-h-[80vh]">
	{#if pendingDeleteJob}
		<button
			class="fixed inset-0 z-40 backdrop-blur-sm "
			type="button"
			aria-label="Close delete confirmation"
			onclick={cancelDeleteJob}
		></button>
		<div
			class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-card p-5 shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-job-title"
			aria-describedby="delete-job-description"
		>
			<h3 id="delete-job-title" class="text-base font-semibold">Delete humanizer job?</h3>
			<p id="delete-job-description" class="mt-2 text-sm text-muted-foreground">
				This will remove the {pendingDeleteJob.tone} • {pendingDeleteJob.level} job from
				your list.
			</p>
			<div class="mt-4 flex justify-end gap-2">
				<button class="rounded-md px-3 py-2 text-sm" type="button" onclick={cancelDeleteJob}>
					Cancel
				</button>
				<button
					class="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground"
					type="button"
					onclick={confirmDeleteJob}
				>
					Delete
				</button>
			</div>
		</div>
	{/if}

	<form
		class="grid gap-4"
		method="POST"
		action="?/humanize"
		use:enhance={() => {
			isHumanizing = true;
			humanizerError = '';
			return async ({ result }) => {
				isHumanizing = false;
				if (result.type === 'success') {
					const payload = result.data as {
						outputText?: string;
						confidenceScore?: number;
					};
					humanizerOutput = payload.outputText ?? '';
					humanizerScore = payload.confidenceScore ?? 0;
					await invalidateAll();
				} else {
					const payload = result.data as { message?: string };
					humanizerError = payload?.message ?? 'Humanizer failed. Please try again.';
				}
			};
		}}
	>
		<input type="hidden" name="model" value={humanizerModel} />
		<div class="grid min-h-[80vh] gap-6 lg:h-full lg:grid-cols-[1.6fr_0.7fr]">
			<section class="flex min-h-[70vh] flex-col rounded-3xl border bg-card p-4 sm:p-6 lg:min-h-0 lg:p-8">
				<div class="grid flex-1 gap-6 lg:grid-cols-2">
				<div class="flex min-h-0 flex-1 flex-col gap-3">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div
							class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
						>
							AI Text
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<button
								class="h-9 rounded-full px-3 text-xs font-medium text-foreground hover:text-primary"
								type="button"
								onclick={clearInput}
							>
								Clear
							</button>
						</div>
					</div>
					<textarea
						class="w-full flex-1 rounded-2xl border-0 bg-background p-4 text-sm leading-relaxed"
						bind:value={humanizerInput}
						name="inputText"
						placeholder="Paste or type your AI-generated text here..."
					></textarea>
				</div>

				<div class="flex min-h-0 flex-1 flex-col gap-3">
					<div
						class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground"
					>
						<span>Humanized</span>
						<div class="flex items-center gap-2">
							<select
								class="h-9 rounded-full border-0 bg-background px-3 text-xs text-foreground"
								bind:value={humanizerLevel}
								name="level"
							>
								{#each levelOptions as option}
									<option value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
								{/each}
							</select>
							<select
								class="h-9 rounded-full border-0 bg-background px-3 text-xs text-foreground"
								bind:value={humanizerTone}
								name="tone"
							>
								{#each toneOptions as option}
									<option value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
								{/each}
							</select>
							<button
								class="rounded-full border px-2 py-1 text-foreground transition hover:text-primary"
								onclick={copyOutput}
								type="button"
								aria-label={didCopy ? 'Copied' : 'Copy output'}
								title={didCopy ? 'Copied' : 'Copy output'}
							>
								<Copy size={14} />
							</button>
						</div>
					</div>
					<div class="relative min-h-0 flex-1">
						<textarea
							class="h-full w-full rounded-2xl border-0 bg-background p-4 text-sm leading-relaxed"
							bind:value={humanizerOutput}
							placeholder="Your humanized output appears here..."
						></textarea>
						{#if isHumanizing}
							<div class="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70">
								<Loader2 class="h-6 w-6 animate-spin text-primary" />
							</div>
						{/if}
					</div>
					{#if humanizerError}
						<div class="text-xs text-destructive">{humanizerError}</div>
					{/if}
				</div>
			</div>

					<button
						class="w-full rounded-2xl bg-primary px-8 py-4 mt-6 text-base font-semibold text-primary-foreground shadow-lg transition disabled:opacity-60 sm:text-lg"
						type="submit"
						disabled={!humanizerInput.trim() || isHumanizing}
					>
						{isHumanizing ? 'Humanizing...' : 'Humanize'}
					</button>
					
			<hr class="my-4 border-dashed"/>
			<details class="rounded-2xl border bg-muted/10 p-3 text-xs text-muted-foreground">
						<summary class="cursor-pointer select-none font-semibold text-foreground">
							Model & settings
						</summary>
						<div class="mt-3 grid gap-2 sm:grid-cols-3">
							<label class="flex flex-col gap-1">
								<span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									Model
								</span>
								<select
									class="h-9 rounded-full border bg-background px-3 text-xs text-foreground"
									bind:value={selectedModelId}
								>
									{#each modelOptions as option}
										<option value={option}>{option}</option>
									{/each}
									<option value="custom">Custom</option>
								</select>
							</label>
							<label class="flex flex-col gap-1">
								<span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									Custom model
								</span>
								{#if selectedModelId === 'custom'}
									<input
										class="h-9 rounded-full border bg-background px-3 text-xs text-foreground"
										placeholder="e.g. gpt-4o-mini"
										bind:value={customModelId}
									/>
								{:else}
									<div class="h-9 rounded-full border border-dashed bg-muted/30"></div>
								{/if}
							</label>
							<label class="flex flex-col gap-1 sm:col-span-3">
								<span class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									<span>Max tokens</span>
									<span class="rounded-full border px-2 py-0.5 text-[10px] text-foreground">
										{maxTokens}
									</span>
								</span>
								<input
									class="w-full"
									type="range"
									min="64"
									max="8192"
									step="64"
									name="maxTokens"
									bind:value={maxTokens}
								/>
							</label>
							<label class="flex flex-col gap-1">
								<span class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									<span>Temperature</span>
									<span class="rounded-full border px-2 py-0.5 text-[10px] text-foreground">
										{temperature.toFixed(1)}
									</span>
								</span>
								<input
									class="w-full"
									type="range"
									min="0"
									max="2"
									step="0.1"
									name="temperature"
									bind:value={temperature}
								/>
							</label>
							<label class="flex flex-col gap-1">
								<span class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									<span>Top P</span>
									<span class="rounded-full border px-2 py-0.5 text-[10px] text-foreground">
										{topP.toFixed(2)}
									</span>
								</span>
								<input
									class="w-full"
									type="range"
									min="0"
									max="1"
									step="0.05"
									name="topP"
									bind:value={topP}
								/>
							</label>
							<label class="flex flex-col gap-1">
								<span class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									<span>Frequency penalty</span>
									<span class="rounded-full border px-2 py-0.5 text-[10px] text-foreground">
										{frequencyPenalty.toFixed(1)}
									</span>
								</span>
								<input
									class="w-full"
									type="range"
									min="0"
									max="2"
									step="0.1"
									name="frequencyPenalty"
									bind:value={frequencyPenalty}
								/>
							</label>
							<label class="flex flex-col gap-1 sm:col-span-3">
								<span class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									<span>Presence penalty</span>
									<span class="rounded-full border px-2 py-0.5 text-[10px] text-foreground">
										{presencePenalty.toFixed(1)}
									</span>
								</span>
								<input
									class="w-full"
									type="range"
									min="0"
									max="2"
									step="0.1"
									name="presencePenalty"
									bind:value={presencePenalty}
								/>
							</label>
							<label class="flex flex-col gap-1 sm:col-span-3">
								<span class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
									Custom prompt note
								</span>
								<textarea
									class="min-h-[80px] w-full rounded-2xl border bg-background p-3 text-xs text-foreground"
									placeholder="Add any extra instruction for the humanizer prompt (e.g. keep it punchy, avoid jargon)."
									name="options"
								></textarea>
							</label>
						</div>
					</details>
		</section>

			<aside class="flex h-full flex-col rounded-2xl border bg-card p-6 lg:max-h-[70vh]">
				<h3 class="text-lg font-semibold">Recent Jobs</h3>
				<div class="mt-4 flex-1 space-y-3 overflow-y-auto ">
				{#each jobs as job}
					<div
						class="cursor-pointer rounded-xl border p-3 transition hover:border-border/70 hover:bg-muted/20"
						onclick={() => loadJob(job)}
					>
					<div class="flex items-start justify-between gap-2">
						<div class="flex-1">
							<div class="text-sm font-semibold line-clamp-2">
								{job.outputText ?? job.inputText}
							</div>
							<div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
								<span class="rounded-full border px-2 py-0.5">{job.tone}</span>
								<span class="rounded-full border px-2 py-0.5">{job.level}</span>
							</div>
						</div>
						<button
							class="rounded-full border p-2 text-muted-foreground transition hover:text-foreground"
							aria-label="Delete job"
							type="button"
								onclick={(event) => {
									event.stopPropagation();
									startDeleteJob(job);
								}}
							>
								<Trash2 size={14} />
							</button>
						</div>
					</div>
				{/each}
				{#if jobs.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No humanizer jobs yet.
					</div>
				{/if}
				</div>
			</aside>
		</div>
	</form>
</div>
