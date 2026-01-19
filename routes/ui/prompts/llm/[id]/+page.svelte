<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		createLlmFile,
		updateLlmFile,
		deleteLlmFileVersion
	} from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle
	} from '$lib/components/ui/sheet';
	import type { LlmFileVersion } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import type { PageData } from './$types';

	export let data: PageData;

	let isNew = true;
	let fileId: string | null = null;
	let lastLoadedId: string | null = null;

	let llmTitle = '';
	let llmFilename = 'llm.txt';
	let llmContent = '';
	let llmLabel = '';
	let llmCommit = '';

	let activeVersion: LlmFileVersion | null = null;
	let deletingVersionId: string | null = null;
	let versionModalOpen = false;
	let versionsOpen = false;
	let displayTitle = 'New LLM.txt';

	const resetForm = () => {
		llmTitle = '';
		llmFilename = 'llm.txt';
		llmContent = '';
		llmLabel = '';
		llmCommit = '';
		activeVersion = null;
	};

	const hydrateForm = () => {
		if (!data.file) return;
		const latestVersion = data.versions[0];
		llmTitle = data.file.title;
		llmFilename = data.file.filename;
		llmContent = latestVersion?.content ?? '';
		llmLabel = latestVersion?.label ?? '';
		llmCommit = '';
		activeVersion = null;
	};

	$: if (data.isNew && lastLoadedId !== 'new') {
		isNew = true;
		fileId = null;
		lastLoadedId = 'new';
		resetForm();
	}

	$: if (!data.isNew && data.file && data.file.id !== lastLoadedId) {
		isNew = false;
		fileId = data.file.id;
		lastLoadedId = data.file.id;
		hydrateForm();
	}
	$: displayTitle = llmTitle.trim() || (isNew ? 'New LLM.txt' : 'Untitled LLM.txt');

	const saveLlmFile = async () => {
		if (!llmTitle.trim() || !llmContent.trim()) {
			toast.error('Title and content are required');
			return;
		}

		const commitMessage = llmCommit.trim() || new Date().toLocaleString();
		const payload = {
			title: llmTitle.trim(),
			filename: llmFilename.trim(),
			content: llmContent.trim(),
			label: llmLabel.trim() || undefined,
			commitMessage
		};

		if (isNew) {
			try {
				const created = await createLlmFile(payload);
				toast.success('LLM.txt created');
				await invalidateAll();
				goto(`/ui/MoLOS-AI-Knowledge/prompts/llm/${created.id}`);
			} catch (err) {
				toast.error(err instanceof Error ? err.message : 'Failed to create LLM.txt');
			}
			return;
		}

		if (!fileId) return;
		try {
			await updateLlmFile(fileId, payload);
			toast.success('LLM.txt saved');
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save LLM.txt');
		}
		llmCommit = '';
	};

	const viewVersion = (version: LlmFileVersion) => {
		activeVersion = version;
		versionModalOpen = true;
	};

	const restoreVersion = async (version: LlmFileVersion) => {
		if (!fileId) return;

		llmContent = version.content;
		llmLabel = version.label ?? '';
		llmCommit = `Restored v${version.versionNumber}`;
		try {
			await updateLlmFile(fileId, {
				content: version.content,
				label: version.label ?? undefined,
				commitMessage: llmCommit
			});
			toast.success('Version restored');
			await invalidateAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to restore version');
		}
	};

	const removeVersion = async (version: LlmFileVersion) => {
		if (!fileId) return;
		deletingVersionId = version.id;
		try {
			await deleteLlmFileVersion(fileId, version.id);
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
				<div class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					Knowledge prompts
				</div>
				<h2 class="text-2xl font-semibold tracking-tight">{displayTitle}</h2>
				<p class="text-sm text-muted-foreground">
					{isNew
						? 'Create a fresh instruction file and save your first version.'
						: 'Edit instructions, review versions, and restore content.'}
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-3 sm:justify-end">
				<button
					class="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
					on:click={saveLlmFile}
				>
					{isNew ? 'Create LLM.txt' : 'Save changes'}
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
				<h3 class="text-sm font-semibold">File details</h3>
				<div class="mt-4 grid gap-4">
					<input
						class="h-10 rounded-md border bg-background px-3 text-sm"
						bind:value={llmTitle}
						placeholder="Title"
					/>
				</div>
			</section>

			<section class="rounded-[28px] border bg-card/80 p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-semibold">LLM.txt content</h3>
					<span class="text-xs text-muted-foreground">Main draft</span>
				</div>
				<textarea
					class="mt-4 min-h-[320px] w-full rounded-md border bg-background p-3 text-sm"
					bind:value={llmContent}
					placeholder="LLM.txt content"
				></textarea>
			</section>
		</div>

		<aside class="space-y-4">
			<section class="rounded-[28px] border bg-card/80 p-5 shadow-sm">
				<h3 class="text-sm font-semibold">File metadata</h3>
				<div class="mt-4 grid gap-3">
					<input
						class="h-10 rounded-md border bg-background px-3 text-sm"
						bind:value={llmFilename}
						placeholder="Filename"
					/>
					<input
						class="h-10 rounded-md border bg-background px-3 text-sm"
						bind:value={llmLabel}
						placeholder="Label"
					/>
				</div>
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
									{version.label || version.commitMessage || 'No label'}
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
			<DialogTitle class="text-xl font-semibold">LLM.txt version</DialogTitle>
		</DialogHeader>
		{#if activeVersion}
			<div class="mt-2 space-y-1 text-xs text-muted-foreground">
				<div>v{activeVersion.versionNumber}</div>
				<div>{activeVersion.label || activeVersion.commitMessage || 'No label'}</div>
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
