<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		createPrompt,
		updatePrompt,
		deletePrompt,
		createSharedLibrary
	} from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import {
		ModelTarget,
		PromptCategory,
		type Prompt
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';

	export let data;

	let prompts: Prompt[] = [];
	let promptVersions = [];
	let libraries = [];
	let libraryPromptIds: string[] = [];
	let selectedPromptId: string | null = null;
	let selectedLibraryId: string | null = null;
	let visiblePrompts: Prompt[] = [];

	let search = '';

	let activePromptId: string | null = null;
	let lastSelectedId: string | null = null;

	let promptTitle = '';
	let promptDescription = '';
	let promptContent = '';
	let promptTags = '';
	let promptCategory = PromptCategory.GENERAL;
	let promptModel = ModelTarget.GPT_4;
	let promptFavorite = false;
	let promptPrivate = false;
	let promptCommit = '';

	let promptModalOpen = false;
	let promptModalWasOpen = false;

	let libraryModalOpen = false;
	let libraryModalWasOpen = false;
	let libraryName = '';
	let libraryDescription = '';
	let libraryPrivate = true;

	const categoryOptions = Object.values(PromptCategory);
	const modelOptions = Object.values(ModelTarget);
	const cardThemes = [
		'bg-emerald-50/70 border-emerald-100',
		'bg-sky-50/70 border-sky-100',
		'bg-amber-50/70 border-amber-100',
		'bg-rose-50/70 border-rose-100',
		'bg-violet-50/70 border-violet-100',
		'bg-lime-50/70 border-lime-100'
	];

	$: ({ prompts, promptVersions, libraries, libraryPromptIds, selectedPromptId, selectedLibraryId } = data);

	const updateQueryParams = (updates: Record<string, string | null>) => {
		const params = new URLSearchParams($page.url.searchParams);
		Object.entries(updates).forEach(([key, value]) => {
			if (!value) params.delete(key);
			else params.set(key, value);
		});
		const query = params.toString();
		goto(query ? `${$page.url.pathname}?${query}` : $page.url.pathname, {
			replaceState: true
		});
	};

	$: if (selectedPromptId && selectedPromptId !== lastSelectedId) {
		const selected = prompts.find((prompt) => prompt.id === selectedPromptId);
		if (selected) {
			activePromptId = selected.id;
			promptTitle = selected.title;
			promptDescription = selected.description ?? '';
			promptContent = selected.content;
			promptTags = selected.tags.join(', ');
			promptCategory = selected.category;
			promptModel = selected.modelTarget;
			promptFavorite = selected.isFavorite;
			promptPrivate = selected.isPrivate;
			promptCommit = '';
			promptModalOpen = true;
			lastSelectedId = selectedPromptId;
		}
	}

	$: if (!promptModalOpen && promptModalWasOpen) {
		resetPromptForm();
		updateQueryParams({ promptId: null });
	}

	$: promptModalWasOpen = promptModalOpen;

	$: if (!libraryModalOpen && libraryModalWasOpen) {
		resetLibraryForm();
	}

	$: libraryModalWasOpen = libraryModalOpen;

	$: visiblePrompts = prompts
		.filter((prompt) =>
			selectedLibraryId ? libraryPromptIds.includes(prompt.id) : true
		)
		.filter((prompt) => prompt.title.toLowerCase().includes(search.toLowerCase()));

	const resetPromptForm = () => {
		activePromptId = null;
		promptTitle = '';
		promptDescription = '';
		promptContent = '';
		promptTags = '';
		promptCategory = PromptCategory.GENERAL;
		promptModel = ModelTarget.GPT_4;
		promptFavorite = false;
		promptPrivate = false;
		promptCommit = '';
		lastSelectedId = null;
	};

	const resetLibraryForm = () => {
		libraryName = '';
		libraryDescription = '';
		libraryPrivate = true;
	};

	const openNewPrompt = () => {
		resetPromptForm();
		promptModalOpen = true;
		updateQueryParams({ promptId: null });
	};

	const openEditPrompt = (prompt: Prompt) => {
		activePromptId = prompt.id;
		promptTitle = prompt.title;
		promptDescription = prompt.description ?? '';
		promptContent = prompt.content;
		promptTags = prompt.tags.join(', ');
		promptCategory = prompt.category;
		promptModel = prompt.modelTarget;
		promptFavorite = prompt.isFavorite;
		promptPrivate = prompt.isPrivate;
		promptCommit = '';
		promptModalOpen = true;
		updateQueryParams({ promptId: prompt.id });
	};

	const selectLibrary = (libraryId: string | null) => {
		updateQueryParams({ libraryId, promptId: null });
	};

	const savePrompt = async () => {
		if (!promptTitle.trim() || !promptContent.trim()) return;

		const tags = promptTags
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean)
			.slice(0, 10);
		const payload = {
			title: promptTitle.trim(),
			description: promptDescription.trim() || undefined,
			content: promptContent.trim(),
			category: promptCategory,
			modelTarget: promptModel,
			tags,
			isFavorite: promptFavorite,
			isPrivate: promptPrivate,
			commitMessage: promptCommit.trim() || undefined
		};

		if (activePromptId) {
			await updatePrompt(activePromptId, payload);
		} else {
			await createPrompt(payload);
		}

		await invalidate();
		promptModalOpen = false;
	};

	const removePrompt = async (promptId: string) => {
		await deletePrompt(promptId);
		await invalidate();
	};

	const saveLibrary = async () => {
		if (!libraryName.trim()) return;
		await createSharedLibrary({
			name: libraryName.trim(),
			description: libraryDescription.trim() || undefined,
			isPrivate: libraryPrivate
		});
		await invalidate();
		libraryModalOpen = false;
	};
</script>

<div class="space-y-6">
	<section class="rounded-[28px] border bg-card/80 p-6 shadow-sm">
		<div class="flex flex-col gap-5">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Prompt Library</h2>
					<p class="text-sm text-muted-foreground">
						Curate prompts and collections for every workflow.
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
						class="rounded-full border px-4 py-2 text-xs font-semibold text-foreground"
						onclick={() => (libraryModalOpen = true)}
					>
						Add library
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
					{visiblePrompts.length} prompt{visiblePrompts.length === 1 ? '' : 's'}
				</div>
			</div>

			<div class="flex gap-3 overflow-x-auto pb-2">
				<button
					class={`flex min-w-[140px] flex-col rounded-2xl border px-4 py-3 text-left text-xs transition ${
						!selectedLibraryId
							? 'border-foreground bg-foreground text-background'
							: 'border-border bg-background text-foreground hover:bg-muted/40'
					}`}
					onclick={() => selectLibrary(null)}
				>
					<span class="text-[10px] uppercase text-muted-foreground">All</span>
					<span class="text-sm font-semibold">All prompts</span>
				</button>
				{#each libraries as library}
					<button
						class={`flex min-w-[180px] flex-col rounded-2xl border px-4 py-3 text-left text-xs transition ${
							selectedLibraryId === library.id
								? 'border-foreground bg-foreground text-background'
								: 'border-border bg-background text-foreground hover:bg-muted/40'
						}`}
						onclick={() => selectLibrary(library.id)}
					>
						<span class="text-[10px] uppercase text-muted-foreground">
							{library.isPrivate ? 'Private' : 'Shared'}
						</span>
						<span class="text-sm font-semibold">{library.name}</span>
						{#if library.description}
							<span class="text-xs text-muted-foreground">{library.description}</span>
						{/if}
					</button>
				{/each}
				{#if libraries.length === 0}
					<div class="rounded-2xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
						No libraries yet. Create one to group prompts.
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each visiblePrompts as prompt, index (prompt.id)}
			<article class={`rounded-2xl border p-4 shadow-sm ${cardThemes[index % cardThemes.length]}`}>
				<div class="flex items-start justify-between gap-3">
					<div>
						<div class="text-sm font-semibold">{prompt.title}</div>
						<div class="text-xs text-muted-foreground">
							{prompt.category} • {prompt.modelTarget}
						</div>
					</div>
					<div class="flex gap-2 text-[11px]">
						<button
							class="rounded-full border px-3 py-1"
							onclick={() => openEditPrompt(prompt)}
						>
							Edit
						</button>
						<button
							class="rounded-full border px-3 py-1"
							onclick={() => removePrompt(prompt.id)}
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
	</section>
</div>

<Dialog bind:open={promptModalOpen}>
	<DialogContent class="max-w-2xl rounded-3xl">
		<DialogHeader>
			<DialogTitle class="text-2xl font-semibold">
				{activePromptId ? 'Edit prompt' : 'New prompt'}
			</DialogTitle>
			<DialogDescription>
				Capture a clean prompt and keep versions tracked.
			</DialogDescription>
		</DialogHeader>
		<div class="mt-6 grid gap-4">
			<input
				class="h-10 rounded-md border bg-background px-3 text-sm"
				bind:value={promptTitle}
				placeholder="Prompt title"
			/>
			<textarea
				class="min-h-[140px] rounded-md border bg-background p-3 text-sm"
				bind:value={promptContent}
				placeholder="Prompt content"
			></textarea>
			<textarea
				class="min-h-[90px] rounded-md border bg-background p-3 text-sm"
				bind:value={promptDescription}
				placeholder="Description"
			></textarea>
			<div class="grid gap-3 md:grid-cols-2">
				<select class="h-10 rounded-md border bg-background px-3 text-sm" bind:value={promptCategory}>
					{#each categoryOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<select class="h-10 rounded-md border bg-background px-3 text-sm" bind:value={promptModel}>
					{#each modelOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</div>
			<input
				class="h-10 rounded-md border bg-background px-3 text-sm"
				bind:value={promptTags}
				placeholder="Tags (comma separated)"
			/>
			<input
				class="h-10 rounded-md border bg-background px-3 text-sm"
				bind:value={promptCommit}
				placeholder="Commit message (optional)"
			/>
			<div class="flex flex-wrap gap-4 text-sm">
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={promptFavorite} /> Favorite
				</label>
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={promptPrivate} /> Private
				</label>
			</div>
		</div>
		{#if promptVersions.length}
			<div class="mt-6">
				<h4 class="text-sm font-semibold">Version history</h4>
				<ul class="mt-2 space-y-2 text-xs text-muted-foreground">
					{#each promptVersions as version}
						<li class="rounded-md border px-3 py-2">
							v{version.versionNumber} • {version.commitMessage || 'No message'}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<DialogFooter class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
			<button class="rounded-full border px-4 py-2 text-sm" onclick={() => (promptModalOpen = false)}>
				Cancel
			</button>
			<button
				class="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
				onclick={savePrompt}
			>
				{activePromptId ? 'Save changes' : 'Create prompt'}
			</button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<Dialog bind:open={libraryModalOpen}>
	<DialogContent class="max-w-xl rounded-3xl">
		<DialogHeader>
			<DialogTitle class="text-2xl font-semibold">New library</DialogTitle>
			<DialogDescription>Group prompts into shared collections.</DialogDescription>
		</DialogHeader>
		<div class="mt-6 grid gap-4">
			<input
				class="h-10 rounded-md border bg-background px-3 text-sm"
				bind:value={libraryName}
				placeholder="Library name"
			/>
			<input
				class="h-10 rounded-md border bg-background px-3 text-sm"
				bind:value={libraryDescription}
				placeholder="Description"
			/>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={libraryPrivate} /> Private
			</label>
		</div>
		<DialogFooter class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
			<button class="rounded-full border px-4 py-2 text-sm" onclick={() => (libraryModalOpen = false)}>
				Cancel
			</button>
			<button
				class="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
				onclick={saveLibrary}
			>
				Create library
			</button>
		</DialogFooter>
	</DialogContent>
</Dialog>
