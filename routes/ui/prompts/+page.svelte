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

<div class="space-y-6" in:fade={{ duration: 180 }}>
	<section class="rounded-[28px] border bg-card/80 p-6 shadow-sm" in:fly={{ y: 12, duration: 220 }}>
		<div class="flex flex-col gap-5">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Knowledge prompts</h2>
					<p class="text-sm text-muted-foreground">
						Curate prompts and LLM.txt files in one workspace.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button
						variant="secondary"
						size="sm"
						class="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
						onclick={openNewPrompt}
					>
						Add prompt
					</Button>
					<Button
						variant="secondary"
						size="sm"
						class="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
						onclick={openNewLlmFile}
					>
						Add LLM.txt
					</Button>
				</div>
			</div>

			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="w-full md:max-w-xs">
					<Input
						class="h-10 w-full rounded-full border bg-background px-4 text-sm"
						placeholder="Search prompts"
						bind:value={search}
					/>
				</div>
				<div class="w-full md:max-w-xs">
					<Input
						class="h-10 w-full rounded-full border bg-background px-4 text-sm"
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
						class={`rounded-full border px-3 py-1 ${
							!labelFilter.trim()
								? 'bg-foreground text-background'
								: 'bg-background text-foreground'
						}`}
						onclick={() => (labelFilter = '')}
					>
						All labels
					</Button>
					{#each labelOptions as label}
						<Button
							variant="outline"
							size="sm"
							class={`rounded-full border px-3 py-1 ${
								normalize(labelFilter) === normalize(label)
									? 'bg-foreground text-background'
									: 'bg-background text-foreground'
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

	<section class="space-y-4" in:fade={{ duration: 180 }}>
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold">Prompts</h3>
			<span class="text-xs text-muted-foreground">
				{formatCount(visiblePrompts.length, 'prompt')}
			</span>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each visiblePrompts as prompt, index (prompt.id)}
				<article
					class="cursor-pointer rounded-2xl border bg-card/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
					onclick={() => openEditPrompt(prompt)}
					in:fly={{ y: 12, duration: 220, delay: index * 20 }}
					animate:flip
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<span class="text-[10px] uppercase tracking-wide text-muted-foreground">
								Prompt
							</span>
							<div class="text-sm font-semibold">{prompt.title}</div>
						</div>
						<div class="text-[11px] text-muted-foreground">Open to manage</div>
					</div>
					<p class="mt-3 text-xs text-muted-foreground">
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
				<div class="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
					No prompts match this view yet.
				</div>
			{/if}
		</div>
	</section>

	<section class="space-y-4" in:fade={{ duration: 180 }}>
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold">LLM.txt</h3>
			<span class="text-xs text-muted-foreground">
				{formatCount(visibleFiles.length, 'LLM.txt file')}
			</span>
		</div>
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each visibleFiles as file, index (file.id)}
				<article
					class="cursor-pointer rounded-2xl border bg-card/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
					onclick={() => openEditLlmFile(file)}
					in:fly={{ y: 12, duration: 220, delay: index * 20 }}
					animate:flip
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<span class="text-[10px] uppercase tracking-wide text-muted-foreground">
								LLM.txt
							</span>
							<div class="text-sm font-semibold">{file.title}</div>
							<div class="text-xs text-muted-foreground">v{file.currentVersion}</div>
						</div>
						<div class="text-[11px] text-muted-foreground">Open to manage</div>
					</div>
					<p class="mt-3 text-xs text-muted-foreground">
						Instruction set for {file.title}.
					</p>
				</article>
			{/each}
			{#if visibleFiles.length === 0}
				<div class="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
					No LLM.txt files match this view yet.
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
