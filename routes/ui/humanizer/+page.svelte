<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { deleteHumanizerJob } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import { Copy, Loader2, Trash2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { NativeSelect, NativeSelectOption } from '$lib/components/ui/native-select';
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

	const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

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
		if (
			!selectedModelId ||
			(selectedModelId !== 'custom' && !modelOptions.includes(selectedModelId))
		) {
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

<div class="space-y-8 lg:h-full lg:min-h-[80vh] xl:space-y-10">
	{#if pendingDeleteJob}
		<Button
			variant="ghost"
			class="fixed inset-0 z-40 h-full w-full backdrop-blur-sm"
			type="button"
			aria-label="Close delete confirmation"
			onclick={cancelDeleteJob}
		></Button>
		<div
			class="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-card p-5 shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-job-title"
			aria-describedby="delete-job-description"
		>
			<h3 id="delete-job-title" class="text-base font-semibold">Delete humanizer job?</h3>
			<p id="delete-job-description" class="text-muted-foreground mt-2 text-sm">
				This will remove the {pendingDeleteJob.tone} • {pendingDeleteJob.level} job from your list.
			</p>
			<div class="mt-4 flex justify-end gap-2">
				<Button
					variant="outline"
					size="sm"
					class="rounded-md px-3 py-2 text-sm"
					type="button"
					onclick={cancelDeleteJob}
				>
					Cancel
				</Button>
				<Button
					variant="destructive"
					size="sm"
					class="rounded-md px-3 py-2 text-sm"
					type="button"
					onclick={confirmDeleteJob}
				>
					Delete
				</Button>
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
				} else if (result.type === 'failure') {
					const payload = result.data as { message?: string };
					humanizerError = payload?.message ?? 'Humanizer failed. Please try again.';
				} else {
					humanizerError = 'Humanizer failed. Please try again.';
				}
			};
		}}
	>
		<input type="hidden" name="model" value={humanizerModel} />
		<div
			class="grid min-h-[70vh] gap-6 lg:h-full lg:grid-cols-[1.8fr_0.8fr] lg:gap-8 xl:grid-cols-[2fr_1fr]"
		>
			<section
				class="flex min-h-[60vh] flex-col rounded-2xl border bg-card p-4 sm:p-6 lg:min-h-0 lg:p-8 xl:p-10"
			>
				<div class="grid flex-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
					<div class="flex min-h-0 flex-1 flex-col gap-3">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
								AI Text
							</div>
							<div class="flex flex-wrap items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									class="h-9 min-h-[44px] rounded-full px-3 text-xs font-medium text-foreground transition-all duration-200 hover:text-primary"
									type="button"
									onclick={clearInput}
								>
									Clear
								</Button>
							</div>
						</div>
						<Textarea
							class="min-h-[200px] w-full flex-1 rounded-2xl border-2 border-muted bg-background p-4 text-sm leading-relaxed transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:min-h-[300px]"
							bind:value={humanizerInput}
							name="inputText"
							placeholder="Paste or type your AI-generated text here..."
						/>
					</div>

					<div class="flex min-h-0 flex-1 flex-col gap-3">
						<div
							class="text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wider uppercase"
						>
							<span>Humanized</span>
							<div class="flex items-center gap-2">
								<NativeSelect
									class="h-9 rounded-full border-2 border-muted bg-background px-3 text-xs text-foreground transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
									bind:value={humanizerLevel}
									name="level"
								>
									{#each levelOptions as option}
										<NativeSelectOption value={option}>
											{option.charAt(0).toUpperCase() + option.slice(1)}
										</NativeSelectOption>
									{/each}
								</NativeSelect>
								<NativeSelect
									class="h-9 rounded-full border-2 border-muted bg-background px-3 text-xs text-foreground transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
									bind:value={humanizerTone}
									name="tone"
								>
									{#each toneOptions as option}
										<NativeSelectOption value={option}>
											{option.charAt(0).toUpperCase() + option.slice(1)}
										</NativeSelectOption>
									{/each}
								</NativeSelect>
								<Button
									variant="outline"
									size="icon"
									class="h-10 min-h-[44px] w-10 min-w-[44px] rounded-full border-2 px-2 text-foreground transition hover:border-primary/50 hover:text-primary"
									onclick={copyOutput}
									type="button"
									aria-label={didCopy ? 'Copied' : 'Copy output'}
									title={didCopy ? 'Copied' : 'Copy output'}
								>
									<Copy size={14} />
								</Button>
							</div>
						</div>
						<div class="relative min-h-0 flex-1">
							<Textarea
								class="h-full min-h-[200px] w-full rounded-2xl border-2 border-muted bg-background p-4 text-sm leading-relaxed transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:min-h-[300px]"
								bind:value={humanizerOutput}
								placeholder="Your humanized output appears here..."
							/>
							{#if isHumanizing}
								<div
									class="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70"
								>
									<Loader2 class="h-6 w-6 animate-spin text-primary" />
								</div>
							{/if}
						</div>
						{#if humanizerError}
							<div class="text-xs text-destructive">{humanizerError}</div>
						{/if}
					</div>
				</div>

				<Button
					size="lg"
					class="mt-6 w-full rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:scale-[1.02] hover:bg-primary/90 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
					type="submit"
					disabled={!humanizerInput.trim() || isHumanizing}
				>
					{isHumanizing ? 'Humanizing...' : 'Humanize'}
				</Button>

				<hr class="my-4 border-dashed" />
				<details
					class="group text-muted-foreground hover:border-muted-foreground/30 rounded-2xl border-2 border-muted bg-muted/5 p-4 text-xs transition-all duration-200 hover:bg-muted/10"
				>
					<summary class="cursor-pointer font-semibold text-foreground select-none">
						Model & settings
					</summary>
					<div class="mt-3 grid gap-2 sm:grid-cols-3">
						<label class="flex flex-col gap-1">
							<span
								class="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
							>
								Model
							</span>
							<NativeSelect
								class="h-9 rounded-full border-2 border-muted bg-background px-3 text-xs text-foreground transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
								bind:value={selectedModelId}
							>
								{#each modelOptions as option}
									<NativeSelectOption value={option}>{option}</NativeSelectOption>
								{/each}
								<NativeSelectOption value="custom">Custom</NativeSelectOption>
							</NativeSelect>
						</label>
						<label class="flex flex-col gap-1">
							<span
								class="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
							>
								Custom model
							</span>
							{#if selectedModelId === 'custom'}
								<Input
									class="h-9 rounded-full border-2 border-muted bg-background px-3 text-xs text-foreground transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
									placeholder="e.g. gpt-4o-mini"
									bind:value={customModelId}
								/>
							{:else}
								<div
									class="h-9 rounded-full border-2 border-dashed border-muted/50 bg-muted/30"
								></div>
							{/if}
						</label>
						<label class="flex flex-col gap-1 sm:col-span-3">
							<span
								class="text-muted-foreground flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase"
							>
								<span>Max tokens</span>
								<span
									class="rounded-full border-2 border-border/60 px-2 py-0.5 text-[10px] text-foreground"
								>
									{maxTokens}
								</span>
							</span>
							<input
								class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary/80"
								type="range"
								min="64"
								max="8192"
								step="64"
								name="maxTokens"
								bind:value={maxTokens}
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span
								class="text-muted-foreground flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase"
							>
								<span>Temperature</span>
								<span
									class="rounded-full border-2 border-border/60 px-2 py-0.5 text-[10px] text-foreground"
								>
									{temperature.toFixed(1)}
								</span>
							</span>
							<input
								class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary/80"
								type="range"
								min="0"
								max="2"
								step="0.1"
								name="temperature"
								bind:value={temperature}
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span
								class="text-muted-foreground flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase"
							>
								<span>Top P</span>
								<span
									class="rounded-full border-2 border-border/60 px-2 py-0.5 text-[10px] text-foreground"
								>
									{topP.toFixed(2)}
								</span>
							</span>
							<input
								class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary/80"
								type="range"
								min="0"
								max="1"
								step="0.05"
								name="topP"
								bind:value={topP}
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span
								class="text-muted-foreground flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase"
							>
								<span>Frequency penalty</span>
								<span
									class="rounded-full border-2 border-border/60 px-2 py-0.5 text-[10px] text-foreground"
								>
									{frequencyPenalty.toFixed(1)}
								</span>
							</span>
							<input
								class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary/80"
								type="range"
								min="0"
								max="2"
								step="0.1"
								name="frequencyPenalty"
								bind:value={frequencyPenalty}
							/>
						</label>
						<label class="flex flex-col gap-1 sm:col-span-3">
							<span
								class="text-muted-foreground flex items-center justify-between text-[10px] font-semibold tracking-wider uppercase"
							>
								<span>Presence penalty</span>
								<span
									class="rounded-full border-2 border-border/60 px-2 py-0.5 text-[10px] text-foreground"
								>
									{presencePenalty.toFixed(1)}
								</span>
							</span>
							<input
								class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary hover:accent-primary/80"
								type="range"
								min="0"
								max="2"
								step="0.1"
								name="presencePenalty"
								bind:value={presencePenalty}
							/>
						</label>
						<label class="flex flex-col gap-1 sm:col-span-3">
							<span
								class="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase"
							>
								Custom prompt note
							</span>
							<Textarea
								class="min-h-[80px] w-full rounded-xl border-2 border-muted bg-background p-3 text-xs text-foreground transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
								placeholder="Add any extra instruction for the humanizer prompt (e.g. keep it punchy, avoid jargon)."
								name="options"
							/>
						</label>
					</div>
				</details>
			</section>

			<aside
				class="flex h-full flex-col rounded-2xl border bg-card p-4 sm:p-6 lg:max-h-[70vh] lg:p-8"
			>
				<h3 class="text-lg font-semibold lg:text-xl">Recent Jobs</h3>
				<div class="mt-4 flex-1 space-y-3 overflow-y-auto scroll-smooth">
					{#each jobs as job}
						<button
							type="button"
							class="w-full cursor-pointer rounded-xl border-2 border-border/60 p-3 text-left transition-all duration-200 hover:border-border/70 hover:bg-muted/20"
							onclick={() => loadJob(job)}
						>
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1">
									<div class="line-clamp-2 text-sm font-semibold">
										{job.outputText ?? job.inputText}
									</div>
									<div
										class="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-[11px]"
									>
										<span class="rounded-full border-2 px-2 py-0.5">{job.tone}</span>
										<span class="rounded-full border-2 px-2 py-0.5">{job.level}</span>
									</div>
								</div>
								<Button
									variant="outline"
									size="icon"
									class="text-muted-foreground h-9 min-h-[44px] w-9 min-w-[44px] rounded-full border-2 p-2 transition hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
									aria-label="Delete job"
									type="button"
									onclick={(event) => {
										event.stopPropagation();
										startDeleteJob(job);
									}}
								>
									<Trash2 size={14} />
								</Button>
							</div>
						</button>
					{/each}
					{#if jobs.length === 0}
						<div class="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
							No humanizer jobs yet.
						</div>
					{/if}
				</div>
			</aside>
		</div>
	</form>
</div>
