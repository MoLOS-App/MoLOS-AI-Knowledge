<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import {
		createPrompt,
		updatePrompt,
		deletePrompt
	} from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import {
		ModelTarget,
		PromptCategory,
		type Prompt
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';

	export let data;

	let prompts = [];
	let promptVersions = [];
	let selectedPromptId: string | null = null;
	let filteredPrompts = [];

	let search = '';
	let categoryFilter = 'all';
	let modelFilter = 'all';
	let tagFilter = '';
	let favoritesOnly = false;

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

	const categoryOptions = Object.values(PromptCategory);
	const modelOptions = Object.values(ModelTarget);

	$: ({ prompts, promptVersions, selectedPromptId } = data);

	$: filteredPrompts = prompts
		.filter((prompt: Prompt) =>
			prompt.title.toLowerCase().includes(search.toLowerCase())
		)
		.filter((prompt: Prompt) =>
			categoryFilter === 'all' ? true : prompt.category === categoryFilter
		)
		.filter((prompt: Prompt) =>
			modelFilter === 'all' ? true : prompt.modelTarget === modelFilter
		)
		.filter((prompt: Prompt) =>
			favoritesOnly ? prompt.isFavorite : true
		)
		.filter((prompt: Prompt) => {
			if (!tagFilter.trim()) return true;
			return prompt.tags.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase()));
		});

	$: if (selectedPromptId && selectedPromptId !== lastSelectedId) {
		const selected = prompts.find((prompt: Prompt) => prompt.id === selectedPromptId);
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
			lastSelectedId = selectedPromptId;
		}
	}

	const resetForm = () => {
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
		goto('/ui/MoLOS-AI-Knowledge/prompts', { replaceState: true });
	};

	const selectPrompt = (prompt: Prompt) => {
		goto(`/ui/MoLOS-AI-Knowledge/prompts?promptId=${prompt.id}`);
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
		resetForm();
	};

	const removePrompt = async (promptId: string) => {
		await deletePrompt(promptId);
		await invalidate();
		if (activePromptId === promptId) resetForm();
	};
</script>

<div class="space-y-6">
	<section class="rounded-2xl border bg-card p-6">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">Prompts</h2>
				<p class="text-sm text-muted-foreground">
					Manage prompt templates, versions, and favorites.
				</p>
			</div>
			<div class="grid w-full gap-2 text-xs sm:grid-cols-2 lg:flex lg:w-auto">
				<input
					class="h-9 w-full rounded-md border bg-background px-3 sm:w-48"
					bind:value={search}
					placeholder="Search prompts"
				/>
				<select class="h-9 w-full rounded-md border bg-background px-2 sm:w-auto" bind:value={categoryFilter}>
					<option value="all">All categories</option>
					{#each categoryOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<select class="h-9 w-full rounded-md border bg-background px-2 sm:w-auto" bind:value={modelFilter}>
					<option value="all">All models</option>
					{#each modelOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<input
					class="h-9 w-full rounded-md border bg-background px-3 sm:w-36"
					bind:value={tagFilter}
					placeholder="Tag"
				/>
				<label class="flex h-9 items-center gap-2 rounded-md border px-2">
					<input type="checkbox" bind:checked={favoritesOnly} /> Favorites
				</label>
			</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
		<div class="rounded-2xl border bg-card p-6">
			<div class="space-y-3">
				{#each filteredPrompts as prompt (prompt.id)}
					<div class="rounded-xl border p-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm font-semibold">{prompt.title}</div>
								<div class="text-xs text-muted-foreground">
									{prompt.category} • {prompt.modelTarget}
								</div>
							</div>
							<div class="flex gap-2 text-xs">
								<button
									class="rounded-md border px-3 py-1"
									onclick={() => selectPrompt(prompt)}
								>
									Edit
								</button>
								<button
									class="rounded-md border px-3 py-1"
									onclick={() => removePrompt(prompt.id)}
								>
									Delete
								</button>
							</div>
						</div>
						<p class="mt-2 text-xs text-muted-foreground">
							{prompt.description || prompt.content}
						</p>
						<div class="mt-2 text-xs text-muted-foreground">
							Tags: {prompt.tags.join(', ') || 'None'}
						</div>
					</div>
				{/each}
				{#if filteredPrompts.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No prompts found. Adjust your filters or create a new prompt.
					</div>
				{/if}
			</div>
		</div>
		<div class="rounded-2xl border bg-card p-6">
			<h3 class="text-lg font-semibold">{activePromptId ? 'Edit Prompt' : 'New Prompt'}</h3>
			<div class="mt-4 grid gap-4">
				<input
					class="h-10 rounded-md border bg-background px-3 text-sm"
					bind:value={promptTitle}
					placeholder="Prompt title"
				/>
				<textarea
					class="min-h-[120px] rounded-md border bg-background p-3 text-sm"
					bind:value={promptContent}
					placeholder="Prompt content"
				></textarea>
				<textarea
					class="min-h-[80px] rounded-md border bg-background p-3 text-sm"
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
				<div class="flex gap-3">
					<button
						class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
						onclick={savePrompt}
					>
						{activePromptId ? 'Save changes' : 'Create prompt'}
					</button>
					<button class="rounded-md border px-4 py-2 text-sm" onclick={resetForm}>
						Reset
					</button>
				</div>
			</div>
			{#if promptVersions.length}
				<div class="mt-6">
					<h4 class="text-sm font-semibold">Version History</h4>
					<ul class="mt-2 space-y-2 text-xs text-muted-foreground">
						{#each promptVersions as version}
							<li class="rounded-md border px-3 py-2">
								v{version.versionNumber} • {version.commitMessage || 'No message'}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</section>
</div>
