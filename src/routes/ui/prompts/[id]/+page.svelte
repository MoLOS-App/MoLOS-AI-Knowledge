<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		createPrompt,
		updatePrompt,
		deletePromptVersion,
		deletePrompt
	} from '../../stores/api';
	import { type PromptVersion } from '../../models';
	import type { PageData } from './$types';
	import { toast } from 'svelte-sonner';
	import { fade, fly } from 'svelte/transition';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';

	export let data: PageData;

	let isNew = true;
	let promptId: string | null = null;
	let lastLoadedId: string | null = null;

	let promptTitle = '';
	let promptDescription = '';
	let promptContent = '';
	let promptTags = '';
	let promptCommit = '';

	let activeVersion: PromptVersion | null = null;
	let deletingVersionId: string | null = null;
	let versionModalOpen = false;
	let versionsOpen = false;
	let displayTitle = 'New prompt';
	let currentVersion = 1;

	const resetForm = () => {
		promptTitle = '';
		promptDescription = '';
		promptContent = '';
		promptTags = '';
		promptCommit = '';
		activeVersion = null;
	};

	const hydrateForm = () => {
		if (!data.prompt) return;
		promptTitle = data.prompt.title;
		promptDescription = data.prompt.description ?? '';
		promptContent = data.prompt.content;
		promptTags = data.prompt.tags.join(', ');
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
	$: currentVersion = data.versions?.[0]?.versionNumber ?? 1;

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
			tags,
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

	const sharePrompt = () => {
		if (!promptId) return;
		goto(`/ui/MoLOS-AI-Knowledge/prompts/${promptId}/share`);
	};

	const deletePromptItem = async () => {
		if (!promptId) return;
		if (!confirm('Delete this prompt and all versions?')) return;
		try {
			await deletePrompt(promptId);
			toast.success('Prompt deleted');
			await invalidateAll();
			goto('/ui/MoLOS-AI-Knowledge/prompts');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to delete prompt');
		}
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

<svelte:head>
	<title>Edit Prompt - MoLOS AI Knowledge</title>
	<meta name="description" content="Edit and manage your AI prompts with version control." />
</svelte:head>

<section class="space-y-6 xl:space-y-8" in:fade={{ duration: 180 }}>
	<header
		class="rounded-2xl border bg-card/80 p-6 shadow-sm lg:p-8 xl:p-10"
		in:fly={{ y: 12, duration: 220 }}
	>
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-2">
				<input
					class="placeholder:text-muted-foreground w-full border-b-2 border-transparent bg-transparent text-2xl font-semibold tracking-tight transition-colors duration-200 outline-none focus:border-primary sm:max-w-2xl lg:max-w-3xl lg:text-3xl"
					bind:value={promptTitle}
					placeholder="Untitled prompt"
				/>
				<Input
					class="text-muted-foreground w-full border-transparent bg-transparent px-0 text-sm focus-visible:bg-muted/30 sm:max-w-2xl lg:max-w-3xl lg:text-base"
					bind:value={promptDescription}
					placeholder="Add a short description"
				/>
			</div>
			<div class="flex flex-wrap items-center gap-3 sm:justify-end">
				<Button
					variant="outline"
					size="sm"
					class="text-md min-h-[44px] rounded-full px-4 py-2 font-semibold transition-all duration-200 hover:bg-muted"
					onclick={() => goto('/ui/MoLOS-AI-Knowledge/prompts')}
				>
					Go back
				</Button>
			</div>
		</div>
	</header>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8" in:fade={{ duration: 180 }}>
		<div class="space-y-6 xl:space-y-8">
			<section
				class="rounded-2xl border bg-card/80 p-6 shadow-sm lg:p-8 xl:p-10"
				in:fly={{ y: 10, duration: 200 }}
			>
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-semibold lg:text-base">Prompt content</h3>
					<span class="text-muted-foreground text-xs lg:text-sm">Main draft</span>
				</div>
				<Textarea
					class="mt-4 min-h-[420px] w-full rounded-xl border-2 border-muted bg-background p-4 text-sm transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
					bind:value={promptContent}
					placeholder="Write the prompt content (Markdown supported)"
				/>
			</section>
		</div>

		<aside class="space-y-4 xl:space-y-5">
			<div
				class="rounded-2xl border bg-card/80 p-5 shadow-sm lg:p-6"
				in:fly={{ y: 10, duration: 200 }}
			>
				<h3 class="text-sm font-semibold lg:text-base">Commit</h3>
				<div class="mt-4 grid gap-3">
					<Input
						class="h-11 w-full rounded-lg border-2 border-muted bg-background px-4 text-sm transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
						bind:value={promptCommit}
						placeholder="Commit message (optional)"
					/>
					<Button
						size="sm"
						class="min-h-[44px] rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-all duration-200 hover:opacity-90"
						onclick={savePrompt}
					>
						{isNew ? 'Create prompt' : 'Save changes'}
					</Button>
				</div>
			</div>

			<section
				class="rounded-2xl border bg-card/80 p-5 shadow-sm lg:p-6"
				in:fly={{ y: 10, duration: 200 }}
			>
				<h3 class="text-sm font-semibold lg:text-base">Version</h3>
				<div class="mt-4 flex items-center justify-between text-sm">
					<div class="text-muted-foreground text-xs">Current</div>
					<div class="text-sm font-semibold">v{currentVersion}</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					class="mt-4 min-h-[44px] w-full rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:bg-muted"
					onclick={() => {
						versionsOpen = true;
					}}
				>
					Show versions
				</Button>
			</section>

			<section
				class="rounded-2xl border bg-card/80 p-5 shadow-sm lg:p-6"
				in:fly={{ y: 10, duration: 200 }}
			>
				<h3 class="text-sm font-semibold lg:text-base">Actions</h3>
				<div class="mt-4 flex flex-col gap-2">
					<Button
						variant="outline"
						size="sm"
						class="min-h-[44px] rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:bg-muted"
						onclick={sharePrompt}
						disabled={!promptId}
					>
						Share prompt
					</Button>
					<Button
						variant="outline"
						size="sm"
						class="min-h-[44px] rounded-full px-4 py-2 text-xs font-semibold text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
						onclick={deletePromptItem}
						disabled={!promptId}
					>
						Delete prompt
					</Button>
				</div>
			</section>
		</aside>
	</div>
</section>

<Sheet bind:open={versionsOpen}>
	<SheetContent class="rounded-none p-0 sm:max-w-md">
		<SheetHeader class="border-b bg-background/80 px-5 py-4 backdrop-blur">
			<SheetTitle>Versions</SheetTitle>
			<p class="text-muted-foreground text-xs">{data.versions.length} total</p>
		</SheetHeader>
		<div class="flex-1 overflow-auto scroll-smooth px-5 py-4">
			<div class="space-y-3">
				{#if data.versions.length === 0}
					<p class="text-muted-foreground text-xs">No versions yet.</p>
				{:else}
					{#each data.versions as version}
						<div
							class="rounded-xl border-2 border-border/60 bg-background/70 p-3 transition-colors hover:border-border/80"
						>
							<div class="flex items-start justify-between gap-2">
								<div>
									<div class="text-xs font-semibold">v{version.versionNumber}</div>
									<div class="text-muted-foreground text-[11px]">
										{version.commitMessage || 'No message'}
									</div>
									<div class="text-muted-foreground text-[10px]">
										{formatTimestamp(version.createdAt)}
									</div>
								</div>
								<div class="flex flex-col gap-2 text-[10px]">
									<Button
										variant="outline"
										size="sm"
										class="min-h-[36px] rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-muted"
										onclick={() => viewVersion(version)}
									>
										View
									</Button>
									<Button
										variant="outline"
										size="sm"
										class="min-h-[36px] rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-muted"
										onclick={() => restoreVersion(version)}
									>
										Restore
									</Button>
									<Button
										variant="outline"
										size="sm"
										class="min-h-[36px] rounded-full px-3 py-1.5 text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
										onclick={() => removeVersion(version)}
										disabled={deletingVersionId === version.id}
									>
										Delete
									</Button>
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
			<div class="text-muted-foreground mt-2 space-y-1 text-xs">
				<div>v{activeVersion.versionNumber}</div>
				<div>{activeVersion.commitMessage || 'No message'}</div>
				<div>{formatTimestamp(activeVersion.createdAt)}</div>
			</div>
			<pre
				class="mt-4 max-h-[420px] overflow-auto rounded-md border bg-background/60 p-4 text-[11px]">
{activeVersion.content}
			</pre>
		{:else}
			<p class="text-muted-foreground mt-3 text-xs">No version selected.</p>
		{/if}
	</DialogContent>
</Dialog>
