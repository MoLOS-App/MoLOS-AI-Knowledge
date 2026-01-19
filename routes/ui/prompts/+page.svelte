<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
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

	export let data: PageData;

	let prompts: Prompt[] = [];
	let files: LlmFile[] = [];
	let visiblePrompts: Prompt[] = [];
	let visibleFiles: LlmFile[] = [];

	let search = '';

	let promptDeleteOpen = false;
	let promptToDelete: Prompt | null = null;

	const formatCount = (value: number, label: string) =>
		`${value} ${label}${value === 1 ? '' : 's'}`;

	$: ({ prompts, files } = data);

	$: visiblePrompts = prompts
		.filter((prompt) => prompt.title.toLowerCase().includes(search.toLowerCase()));

	$: visibleFiles = files
		.filter((file) =>
			`${file.title} ${file.filename}`.toLowerCase().includes(search.toLowerCase())
		);

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

<div class="space-y-6">
	<section class="rounded-[28px] border bg-card/80 p-6 shadow-sm">
		<div class="flex flex-col gap-5">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Knowledge prompts</h2>
					<p class="text-sm text-muted-foreground">
						Curate prompts and LLM.txt files in one workspace.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<button
						class="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
						onclick={openNewPrompt}
					>
						Add prompt
					</button>
					<button
						class="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
						onclick={openNewLlmFile}
					>
						Add LLM.txt
					</button>
				</div>
			</div>

			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="w-full md:max-w-xs">
					<input
						class="h-10 w-full rounded-full border bg-background px-4 text-sm"
						placeholder="Search prompts"
						bind:value={search}
					/>
				</div>
				<div class="text-xs text-muted-foreground">
					{formatCount(visiblePrompts.length, 'prompt')} •
					{formatCount(visibleFiles.length, 'LLM.txt file')}
				</div>
			</div>

		</div>
	</section>

	<section class="space-y-4">
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
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<span class="text-[10px] uppercase tracking-wide text-muted-foreground">
								Prompt
							</span>
							<div class="text-sm font-semibold">{prompt.title}</div>
							<div class="text-xs text-muted-foreground">
								{prompt.category} • {prompt.modelTarget}
							</div>
						</div>
						<div class="flex gap-2 text-[11px]">
							<button
								class="rounded-full border px-3 py-1"
								onclick={(event) => {
									event.stopPropagation();
									openEditPrompt(prompt);
								}}
							>
								Edit
							</button>
							<button
								class="rounded-full border px-3 py-1"
								onclick={(event) => {
									event.stopPropagation();
									openSharePrompt(prompt.id);
								}}
							>
								Share
							</button>
							<button
								class="rounded-full border px-3 py-1"
								onclick={(event) => {
									event.stopPropagation();
									openDeletePrompt(prompt);
								}}
							>
								Delete
							</button>
						</div>
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

	<section class="space-y-4">
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
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<span class="text-[10px] uppercase tracking-wide text-muted-foreground">
								LLM.txt
							</span>
							<div class="text-sm font-semibold">{file.title}</div>
							<div class="text-xs text-muted-foreground">
								{file.filename} • v{file.currentVersion}
							</div>
						</div>
						<div class="flex gap-2 text-[11px]">
							<button
								class="rounded-full border px-3 py-1"
								onclick={(event) => {
									event.stopPropagation();
									openEditLlmFile(file);
								}}
							>
								Edit
							</button>
						</div>
					</div>
					<p class="mt-3 text-xs text-muted-foreground">
						Instruction set for {file.filename}.
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
			<button
				class="rounded-full border px-4 py-2 text-sm"
				onclick={() => (promptDeleteOpen = false)}
			>
				Cancel
			</button>
			<button
				class="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
				onclick={confirmDeletePrompt}
			>
				Delete prompt
			</button>
		</DialogFooter>
	</DialogContent>
</Dialog>
