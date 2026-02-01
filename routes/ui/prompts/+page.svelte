<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
	import { deletePrompt } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import type {
		Prompt,
		LlmFile
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import type { PageData } from './$types';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	export let data: PageData;

	let prompts: Prompt[] = [];
	let files: LlmFile[] = [];
	let visiblePrompts: Prompt[] = [];
	let visibleFiles: LlmFile[] = [];
	let labelOptions: string[] = [];

	let search = '';
	let labelFilter = '';

	let promptDeleteOpen = false;
	let promptToDelete: Prompt | null = null;

	const formatCount = (value: number, label: string) =>
		`${value} ${label}${value === 1 ? '' : 's'}`;
	const normalize = (value: string) => value.trim().toLowerCase();

	$: ({ prompts, files } = data);

	$: visiblePrompts = prompts.filter((prompt) => {
		const matchesSearch = prompt.title.toLowerCase().includes(search.toLowerCase());
		const normalizedLabel = normalize(labelFilter);
		const matchesLabel =
			!normalizedLabel ||
			prompt.tags.some((tag) => normalize(tag) === normalizedLabel);
		return matchesSearch && matchesLabel;
	});

	$: labelOptions = Array.from(
		new Set(prompts.flatMap((prompt) => prompt.tags.map((tag) => tag.trim())).filter(Boolean))
	).sort((a, b) => a.localeCompare(b));

	$: visibleFiles = files
		.filter((file) => file.title.toLowerCase().includes(search.toLowerCase()));

	const openNewPrompt = () => {
		goto('/ui/MoLOS-AI-Knowledge/prompts/new');
	};

	const openEditPrompt = (prompt: Prompt) => {
		goto(`/ui/MoLOS-AI-Knowledge/prompts/${prompt.id}`);
	};

	const openNewLlmFile = () => {
		goto('/ui/MoLOS-AI-Knowledge/prompts/llm/new');
	};

	const openEditLlmFile = (file: LlmFile) => {
		goto(`/ui/MoLOS-AI-Knowledge/prompts/llm/${file.id}`);
	};

	const removePrompt = async (promptId: string) => {
		await deletePrompt(promptId);
		await invalidateAll();
	};

	const openDeletePrompt = (prompt: Prompt) => {
		promptToDelete = prompt;
		promptDeleteOpen = true;
	};

	const confirmDeletePrompt = async () => {
		if (!promptToDelete) return;
		await removePrompt(promptToDelete.id);
		promptDeleteOpen = false;
		promptToDelete = null;
	};

	const openSharePrompt = (promptId: string) => {
		goto(`/ui/MoLOS-AI-Knowledge/prompts/${promptId}/share`);
	};
</script>

<div class="space-y-6 xl:space-y-8" in:fade={{ duration: 180 }}>
	<section class="rounded-2xl border bg-card/80 p-6 lg:p-8 xl:p-10 shadow-sm" in:fly={{ y: 12, duration: 220 }}>
		<div class="flex flex-col gap-5">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-2xl lg:text-3xl font-semibold tracking-tight">Knowledge prompts</h2>
					<p class="text-sm lg:text-base text-muted-foreground">
						Curate prompts and LLM.txt files in one workspace.
					</p>
				</div>
				<div class="flex flex-wrap gap-2 lg:gap-3">
					<Button
						variant="secondary"
						size="sm"
						class="rounded-full bg-foreground px-4 py-2 lg:px-5 lg:py-2.5 xl:px-6 xl:py-3 min-h-[44px] text-xs lg:text-sm font-semibold text-background transition-all duration-200 hover:opacity-90"
						onclick={openNewPrompt}
					>
						Add prompt
					</Button>
					<Button
						variant="secondary"
						size="sm"
						class="rounded-full bg-foreground px-4 py-2 lg:px-5 lg:py-2.5 xl:px-6 xl:py-3 min-h-[44px] text-xs lg:text-sm font-semibold text-background transition-all duration-200 hover:opacity-90"
						onclick={openNewLlmFile}
					>
						Add LLM.txt
					</Button>
				</div>
			</div>

			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="w-full md:max-w-xs">
					<Input
						class="h-11 w-full rounded-full border-2 border-muted bg-background px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary transition-all duration-200"
						placeholder="Search prompts"
						bind:value={search}
					/>
				</div>
				<div class="w-full md:max-w-xs">
					<Input
						class="h-11 w-full rounded-full border-2 border-muted bg-background px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary transition-all duration-200"
						placeholder="Filter by label"
						bind:value={labelFilter}
					/>
				</div>
				<div class="text-xs text-muted-foreground">
					{formatCount(visiblePrompts.length, 'prompt')} •
					{formatCount(visibleFiles.length, 'LLM.txt file')}
				</div>
			</div>

			{#if labelOptions.length}
				<div class="flex flex-wrap items-center gap-2 text-xs">
					<Button
						variant="outline"
						size="sm"
						class={`rounded-full border-2 px-4 py-2 min-h-[44px] transition-all duration-200 ${
							!labelFilter.trim()
								? 'bg-foreground text-background border-foreground'
								: 'bg-background text-foreground border-muted hover:border-border/70'
						}`}
						onclick={() => (labelFilter = '')}
					>
						All labels
					</Button>
					{#each labelOptions as label}
						<Button
							variant="outline"
							size="sm"
							class={`rounded-full border-2 px-4 py-2 min-h-[44px] transition-all duration-200 ${
								normalize(labelFilter) === normalize(label)
									? 'bg-foreground text-background border-foreground'
									: 'bg-background text-foreground border-muted hover:border-border/70'
							}`}
							onclick={() => (labelFilter = label)}
						>
							{label}
						</Button>
					{/each}
				</div>
			{/if}

		</div>
	</section>

	<section class="space-y-4 xl:space-y-5" in:fade={{ duration: 180 }}>
		<div class="flex items-center justify-between">
			<h3 class="text-lg lg:text-xl font-semibold">Prompts</h3>
			<span class="text-xs lg:text-sm text-muted-foreground">
				{formatCount(visiblePrompts.length, 'prompt')}
			</span>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{#each visiblePrompts as prompt, index (prompt.id)}
				<article
					class="cursor-pointer rounded-2xl border bg-card/80 p-5 lg:p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
					onclick={() => openEditPrompt(prompt)}
					in:fly={{ y: 12, duration: 220, delay: index * 20 }}
					animate:flip
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<span class="text-[10px] lg:text-xs uppercase tracking-wide text-muted-foreground">
								Prompt
							</span>
							<div class="text-sm lg:text-base font-semibold">{prompt.title}</div>
						</div>
						<div class="text-[11px] lg:text-xs text-muted-foreground">Open to manage</div>
					</div>
					<p class="mt-3 text-xs lg:text-sm text-muted-foreground line-clamp-2">
						{prompt.description || prompt.content}
					</p>
					{#if prompt.tags.length}
						<div class="mt-4 flex flex-wrap gap-2">
							{#each prompt.tags as tag}
								<span class="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase">
									{tag}
								</span>
							{/each}
						</div>
					{/if}
				</article>
			{/each}
			{#if visiblePrompts.length === 0}
				<div class="rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
					<p class="text-sm font-medium text-muted-foreground mb-2">No prompts found</p>
					<p class="text-xs text-muted-foreground/70">Try adjusting your search or filters</p>
				</div>
			{/if}
		</div>
	</section>

	<section class="space-y-4 xl:space-y-5" in:fade={{ duration: 180 }}>
		<div class="flex items-center justify-between">
			<h3 class="text-lg lg:text-xl font-semibold">LLM.txt</h3>
			<span class="text-xs lg:text-sm text-muted-foreground">
				{formatCount(visibleFiles.length, 'LLM.txt file')}
			</span>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{#each visibleFiles as file, index (file.id)}
				<article
					class="cursor-pointer rounded-2xl border bg-card/80 p-5 lg:p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
					onclick={() => openEditLlmFile(file)}
					in:fly={{ y: 12, duration: 220, delay: index * 20 }}
					animate:flip
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<span class="text-[10px] lg:text-xs uppercase tracking-wide text-muted-foreground">
								LLM.txt
							</span>
							<div class="text-sm lg:text-base font-semibold">{file.title}</div>
							<div class="text-xs lg:text-sm text-muted-foreground">v{file.currentVersion}</div>
						</div>
						<div class="text-[11px] lg:text-xs text-muted-foreground">Open to manage</div>
					</div>
					<p class="mt-3 text-xs text-muted-foreground">
						Instruction set for {file.title}.
					</p>
				</article>
			{/each}
			{#if visibleFiles.length === 0}
				<div class="rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 lg:p-16 text-center">
					<p class="text-sm lg:text-base font-medium text-muted-foreground mb-2">No LLM.txt files found</p>
					<p class="text-xs lg:text-sm text-muted-foreground/70">Try adjusting your search or filters</p>
				</div>
			{/if}
		</div>
	</section>
</div>

<Dialog bind:open={promptDeleteOpen}>
	<DialogContent class="max-w-md rounded-3xl">
		<DialogHeader>
			<DialogTitle class="text-xl font-semibold">Delete prompt?</DialogTitle>
			<DialogDescription>
				This removes "{promptToDelete?.title ?? 'this prompt'}" and its history. This cannot be undone.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
			<Button
				variant="outline"
				size="sm"
				class="rounded-full px-4 py-2 text-sm"
				onclick={() => (promptDeleteOpen = false)}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				size="sm"
				class="rounded-full px-4 py-2 text-sm font-semibold"
				onclick={confirmDeletePrompt}
			>
				Delete prompt
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
