<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { flip } from 'svelte/animate';
	import { fade, fly } from 'svelte/transition';
	import { deletePrompt } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import type { Prompt, LlmFile } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
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
			!normalizedLabel || prompt.tags.some((tag) => normalize(tag) === normalizedLabel);
		return matchesSearch && matchesLabel;
	});

	$: labelOptions = Array.from(
		new Set(prompts.flatMap((prompt) => prompt.tags.map((tag) => tag.trim())).filter(Boolean))
	).sort((a, b) => a.localeCompare(b));

	$: visibleFiles = files.filter((file) => file.title.toLowerCase().includes(search.toLowerCase()));

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

<svelte:head>
	<title>Knowledge Prompts - MoLOS AI Knowledge</title>
	<meta name="description" content="Curate prompts and LLM.txt files in one workspace." />
</svelte:head>

<div class="space-y-6 xl:space-y-8" in:fade={{ duration: 180 }}>
	<section
		class="rounded-2xl border bg-card/80 p-6 shadow-sm lg:p-8 xl:p-10"
		in:fly={{ y: 12, duration: 220 }}
	>
		<div class="flex flex-col gap-5">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-2xl font-semibold tracking-tight lg:text-3xl">Knowledge prompts</h2>
					<p class="text-muted-foreground text-sm lg:text-base">
						Curate prompts and LLM.txt files in one workspace.
					</p>
				</div>
				<div class="flex flex-wrap gap-2 lg:gap-3">
					<Button
						variant="secondary"
						size="sm"
						class="min-h-[44px] rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-all duration-200 hover:opacity-90 lg:px-5 lg:py-2.5 lg:text-sm xl:px-6 xl:py-3"
						onclick={openNewPrompt}
					>
						Add prompt
					</Button>
					<Button
						variant="secondary"
						size="sm"
						class="min-h-[44px] rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-all duration-200 hover:opacity-90 lg:px-5 lg:py-2.5 lg:text-sm xl:px-6 xl:py-3"
						onclick={openNewLlmFile}
					>
						Add LLM.txt
					</Button>
				</div>
			</div>

			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="w-full md:max-w-xs">
					<Input
						class="h-11 w-full rounded-full border-2 border-muted bg-background px-4 text-sm transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
						placeholder="Search prompts"
						bind:value={search}
					/>
				</div>
				<div class="w-full md:max-w-xs">
					<Input
						class="h-11 w-full rounded-full border-2 border-muted bg-background px-4 text-sm transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
						placeholder="Filter by label"
						bind:value={labelFilter}
					/>
				</div>
				<div class="text-muted-foreground text-xs">
					{formatCount(visiblePrompts.length, 'prompt')} •
					{formatCount(visibleFiles.length, 'LLM.txt file')}
				</div>
			</div>

			{#if labelOptions.length}
				<div class="flex flex-wrap items-center gap-2 text-xs">
					<Button
						variant="outline"
						size="sm"
						class={`min-h-[44px] rounded-full border-2 px-4 py-2 transition-all duration-200 ${
							!labelFilter.trim()
								? 'border-foreground bg-foreground text-background'
								: 'border-muted bg-background text-foreground hover:border-border/70'
						}`}
						onclick={() => (labelFilter = '')}
					>
						All labels
					</Button>
					{#each labelOptions as label}
						<Button
							variant="outline"
							size="sm"
							class={`min-h-[44px] rounded-full border-2 px-4 py-2 transition-all duration-200 ${
								normalize(labelFilter) === normalize(label)
									? 'border-foreground bg-foreground text-background'
									: 'border-muted bg-background text-foreground hover:border-border/70'
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
			<h3 class="text-lg font-semibold lg:text-xl">Prompts</h3>
			<span class="text-muted-foreground text-xs lg:text-sm">
				{formatCount(visiblePrompts.length, 'prompt')}
			</span>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{#each visiblePrompts as prompt, index (prompt.id)}
				<button
					type="button"
					class="w-full cursor-pointer rounded-2xl border bg-card/80 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg lg:p-6"
					onclick={() => openEditPrompt(prompt)}
					in:fly={{ y: 12, duration: 220, delay: index * 20 }}
					animate:flip
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<span class="text-muted-foreground text-[10px] tracking-wide uppercase lg:text-xs">
								Prompt
							</span>
							<div class="text-sm font-semibold lg:text-base">{prompt.title}</div>
						</div>
						<div class="text-muted-foreground text-[11px] lg:text-xs">Open to manage</div>
					</div>
					<p class="text-muted-foreground mt-3 line-clamp-2 text-xs lg:text-sm">
						{prompt.description || prompt.content}
					</p>
					{#if prompt.tags.length}
						<div class="mt-4 flex flex-wrap gap-2">
							{#each prompt.tags as tag}
								<span
									class="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase"
								>
									{tag}
								</span>
							{/each}
						</div>
					{/if}
				</button>
			{/each}
			{#if visiblePrompts.length === 0}
				<div
					class="border-muted-foreground/30 rounded-2xl border-2 border-dashed bg-muted/20 p-12 text-center"
				>
					<p class="text-muted-foreground mb-2 text-sm font-medium">No prompts found</p>
					<p class="text-muted-foreground/70 text-xs">Try adjusting your search or filters</p>
				</div>
			{/if}
		</div>
	</section>

	<section class="space-y-4 xl:space-y-5" in:fade={{ duration: 180 }}>
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold lg:text-xl">LLM.txt</h3>
			<span class="text-muted-foreground text-xs lg:text-sm">
				{formatCount(visibleFiles.length, 'LLM.txt file')}
			</span>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{#each visibleFiles as file, index (file.id)}
				<button
					type="button"
					class="w-full cursor-pointer rounded-2xl border bg-card/80 p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg lg:p-6"
					onclick={() => openEditLlmFile(file)}
					in:fly={{ y: 12, duration: 220, delay: index * 20 }}
					animate:flip
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<span class="text-muted-foreground text-[10px] tracking-wide uppercase lg:text-xs">
								LLM.txt
							</span>
							<div class="text-sm font-semibold lg:text-base">{file.title}</div>
							<div class="text-muted-foreground text-xs lg:text-sm">v{file.currentVersion}</div>
						</div>
						<div class="text-muted-foreground text-[11px] lg:text-xs">Open to manage</div>
					</div>
					<p class="text-muted-foreground mt-3 text-xs">
						Instruction set for {file.title}.
					</p>
				</button>
			{/each}
			{#if visibleFiles.length === 0}
				<div
					class="border-muted-foreground/30 rounded-2xl border-2 border-dashed bg-muted/20 p-12 text-center lg:p-16"
				>
					<p class="text-muted-foreground mb-2 text-sm font-medium lg:text-base">
						No LLM.txt files found
					</p>
					<p class="text-muted-foreground/70 text-xs lg:text-sm">
						Try adjusting your search or filters
					</p>
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
				This removes "{promptToDelete?.title ?? 'this prompt'}" and its history. This cannot be
				undone.
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
