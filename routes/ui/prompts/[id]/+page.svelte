<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		createPrompt,
		updatePrompt,
		deletePromptVersion
	} from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import {
		ModelTarget,
		PromptCategory,
		type PromptVersion
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import type { PageData } from './$types';
	import { toast } from 'svelte-sonner';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle
	} from '$lib/components/ui/sheet';

	export let data: PageData;

	let isNew = true;
	let promptId: string | null = null;
	let lastLoadedId: string | null = null;

	let promptTitle = '';
	let promptDescription = '';
	let promptContent = '';
	let promptTags = '';
	let promptCategory: PromptCategory = PromptCategory.GENERAL;
	let promptModel: ModelTarget = ModelTarget.GPT_4;
	let promptFavorite = false;
	let promptPrivate = false;
	let promptCommit = '';

	let activeVersion: PromptVersion | null = null;
	let deletingVersionId: string | null = null;
	let versionModalOpen = false;
	let versionsOpen = false;
	let displayTitle = 'New prompt';

	const categoryOptions = Object.values(PromptCategory);
	const modelOptions = Object.values(ModelTarget);

	const resetForm = () => {
		promptTitle = '';
		promptDescription = '';
		promptContent = '';
		promptTags = '';
		promptCategory = PromptCategory.GENERAL;
		promptModel = ModelTarget.GPT_4;
		promptFavorite = false;
		promptPrivate = false;
		promptCommit = '';
		activeVersion = null;
	};

	const hydrateForm = () => {
		if (!data.prompt) return;
		promptTitle = data.prompt.title;
		promptDescription = data.prompt.description ?? '';
		promptContent = data.prompt.content;
		promptTags = data.prompt.tags.join(', ');
		promptCategory = data.prompt.category;
		promptModel = data.prompt.modelTarget;
		promptFavorite = data.prompt.isFavorite;
		promptPrivate = data.prompt.isPrivate;
		promptCommit = '';
		activeVersion = null;
	};

	$: if (data.isNew && lastLoadedId !== 'new') {
		isNew = true;
		promptId = null;
		lastLoadedId = 'new';
		resetForm();
	}

	$: if (!data.isNew && data.prompt && data.prompt.id !== lastLoadedId) {
		isNew = false;
		promptId = data.prompt.id;
		lastLoadedId = data.prompt.id;
		hydrateForm();
	}
	$: displayTitle = promptTitle.trim() || (isNew ? 'New prompt' : 'Untitled prompt');

	const savePrompt = async () => {
		if (!promptTitle.trim() || !promptContent.trim()) {
			toast.error('Title and content are required');
			return;
		}

		const tags = promptTags
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean)
			.slice(0, 10);
		const commitMessage = promptCommit.trim() || new Date().toLocaleString();
		const payload = {
			title: promptTitle.trim(),
			description: promptDescription.trim() || undefined,
			content: promptContent.trim(),
			category: promptCategory,
			modelTarget: promptModel,
			tags,
			isFavorite: promptFavorite,
			isPrivate: promptPrivate,
			commitMessage
		};

		if (isNew) {
			try {
				const created = await createPrompt(payload);
				toast.success('Prompt created');
				await invalidateAll();
				goto(`/ui/MoLOS-AI-Knowledge/prompts/${created.id}`);
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to create prompt');
			}
			return;
		}

		if (!promptId) return;
		try {
			await updatePrompt(promptId, payload);
			toast.success('Prompt saved');
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save prompt');
		}
		promptCommit = '';
	};

	const viewVersion = (version: PromptVersion) => {
		activeVersion = version;
		versionModalOpen = true;
	};

	const restoreVersion = async (version: PromptVersion) => {
		if (!promptId) return;

		promptContent = version.content;
		promptCommit = `Restored v${version.versionNumber}`;
		try {
			await updatePrompt(promptId, {
				content: version.content,
				commitMessage: promptCommit
			});
			toast.success('Version restored');
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to restore version');
		}
	};

	const removeVersion = async (version: PromptVersion) => {
		if (!promptId) return;
		deletingVersionId = version.id;
		try {
			await deletePromptVersion(promptId, version.id);
			toast.success('Version deleted');
			await invalidateAll();
			if (activeVersion?.id === version.id) activeVersion = null;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to delete version');
		}
		deletingVersionId = null;
	};

	const formatTimestamp = (value: number) =>
		new Date(value * 1000).toLocaleString(undefined, {
			month: 'short',
			day: '2-digit',
			year: 'numeric'
		});
</script>

<section class="space-y-6">
	<header class="rounded-[28px] border bg-card/80 p-6 shadow-sm">
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-2">
				<input
					class="w-full border-transparent bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground focus:border-b focus:border-foreground/20 sm:max-w-2xl"
					bind:value={promptTitle}
					placeholder="Untitled prompt"
				/>
				<textarea
					class="w-full resize-none border-transparent bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground focus:border-b focus:border-foreground/20 sm:max-w-2xl"
					bind:value={promptDescription}
					placeholder="Add a short description"
					rows={2}
				></textarea>
			</div>
			<div class="flex flex-wrap items-center gap-3 sm:justify-end">
				<button
					class="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
					on:click={savePrompt}
				>
					{isNew ? 'Create prompt' : 'Save changes'}
				</button>
				<button
					class="rounded-full border px-4 py-2 text-xs font-semibold"
					on:click={() => goto('/ui/MoLOS-AI-Knowledge/prompts')}
				>
					Go back
				</button>
				<button
					class="rounded-full border px-4 py-2 text-xs font-semibold"
					on:click={() => {
						versionsOpen = true;
					}}
				>
					Versions
				</button>
			</div>
		</div>
	</header>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
		<div class="space-y-6">
			<section class="rounded-[28px] border bg-card/80 p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-semibold">Prompt content</h3>
					<span class="text-xs text-muted-foreground">Main draft</span>
				</div>
				<textarea
					class="mt-4 min-h-[420px] w-full rounded-md border bg-background p-3 text-sm"
					bind:value={promptContent}
					placeholder="Write the prompt content (Markdown supported)"
				></textarea>
			</section>
		</div>

		<aside class="space-y-4">
			<section class="rounded-[28px] border bg-card/80 p-5 shadow-sm">
				<h3 class="text-sm font-semibold">Publishing</h3>
				<div class="mt-4 grid gap-3">
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
					<div class="flex flex-wrap gap-4 text-sm">
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={promptPrivate} /> Private
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={promptFavorite} /> Favorite
						</label>
					</div>
				</div>
			</section>

			<section class="rounded-[28px] border bg-card/80 p-5 shadow-sm">
				<h3 class="text-sm font-semibold">Labels</h3>
				<input
					class="mt-4 h-10 w-full rounded-md border bg-background px-3 text-sm"
					bind:value={promptTags}
					placeholder="Tags (comma separated)"
				/>
			</section>

		</aside>
	</div>
</section>

<Sheet bind:open={versionsOpen}>
	<SheetContent class="rounded-none p-0 sm:max-w-md">
		<SheetHeader class="border-b bg-background/80 px-5 py-4 backdrop-blur">
			<SheetTitle>Versions</SheetTitle>
			<p class="text-xs text-muted-foreground">{data.versions.length} total</p>
		</SheetHeader>
		<div class="flex-1 overflow-auto px-5 py-4">
			<div class="space-y-3">
			{#if data.versions.length === 0}
				<p class="text-xs text-muted-foreground">No versions yet.</p>
			{:else}
				{#each data.versions as version}
					<div class="rounded-xl border bg-background/70 p-3">
						<div class="flex items-start justify-between gap-2">
							<div>
								<div class="text-xs font-semibold">v{version.versionNumber}</div>
								<div class="text-[11px] text-muted-foreground">
									{version.commitMessage || 'No message'}
								</div>
								<div class="text-[10px] text-muted-foreground">
									{formatTimestamp(version.createdAt)}
								</div>
							</div>
							<div class="flex flex-col gap-2 text-[10px]">
								<button
									class="rounded-full border px-2 py-1"
									on:click={() => viewVersion(version)}
								>
									View
								</button>
								<button
									class="rounded-full border px-2 py-1"
									on:click={() => restoreVersion(version)}
								>
									Restore
								</button>
								<button
									class="rounded-full border px-2 py-1"
									on:click={() => removeVersion(version)}
									disabled={deletingVersionId === version.id}
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
			</div>
		</div>
	</SheetContent>
</Sheet>

<Dialog bind:open={versionModalOpen}>
	<DialogContent class="max-w-2xl rounded-3xl">
		<DialogHeader>
			<DialogTitle class="text-xl font-semibold">Prompt version</DialogTitle>
		</DialogHeader>
		{#if activeVersion}
			<div class="mt-2 space-y-1 text-xs text-muted-foreground">
				<div>v{activeVersion.versionNumber}</div>
				<div>{activeVersion.commitMessage || 'No message'}</div>
				<div>{formatTimestamp(activeVersion.createdAt)}</div>
			</div>
			<pre class="mt-4 max-h-[420px] overflow-auto rounded-md border bg-background/60 p-4 text-[11px]">
{activeVersion.content}
			</pre>
		{:else}
			<p class="mt-3 text-xs text-muted-foreground">No version selected.</p>
		{/if}
	</DialogContent>
</Dialog>
