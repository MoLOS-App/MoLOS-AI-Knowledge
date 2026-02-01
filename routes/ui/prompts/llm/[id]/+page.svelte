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
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { LlmFileVersion } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import type { PageData } from './$types';
	import { fade, fly } from 'svelte/transition';

	export let data: PageData;

	let isNew = true;
	let fileId: string | null = null;
	let lastLoadedId: string | null = null;

	let llmTitle = '';
	let llmContent = '';
	let llmLabel = '';
	let llmCommit = '';

	let activeVersion: LlmFileVersion | null = null;
	let deletingVersionId: string | null = null;
	let versionModalOpen = false;
	let versionsOpen = false;
	let displayTitle = 'New LLM.txt';
	let currentVersion = 1;

	const resetForm = () => {
		llmTitle = '';
		llmContent = '';
		llmLabel = '';
		llmCommit = '';
		activeVersion = null;
	};

	const hydrateForm = () => {
		if (!data.file) return;
		const latestVersion = data.versions[0];
		llmTitle = data.file.title;
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
	$: currentVersion = data.versions?.[0]?.versionNumber ?? 1;

	const saveLlmFile = async () => {
		if (!llmTitle.trim() || !llmContent.trim()) {
			toast.error('Title and content are required');
			return;
		}

		const commitMessage = llmCommit.trim() || new Date().toLocaleString();
		const payload = {
			title: llmTitle.trim(),
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

	const shareLlmFile = async () => {
		if (!fileId) return;
		const shareUrl =
			typeof window !== 'undefined'
				? `${window.location.origin}/ui/MoLOS-AI-Knowledge/prompts/llm/${fileId}`
				: `/ui/MoLOS-AI-Knowledge/prompts/llm/${fileId}`;
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success('Share link copied');
		} catch {
			toast.error('Failed to copy share link');
		}
	};

	const deleteLlmFile = async () => {
		if (!fileId) return;
		if (!confirm('Delete this LLM.txt file and all versions?')) return;
		try {
			await updateLlmFile(fileId, { isDeleted: true });
			toast.success('LLM.txt deleted');
			await invalidateAll();
			goto('/ui/MoLOS-AI-Knowledge/prompts');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to delete LLM.txt');
		}
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

<section class="space-y-6 xl:space-y-8" in:fade={{ duration: 180 }}>
	<header class="rounded-2xl border bg-card/80 p-6 lg:p-8 xl:p-10 shadow-sm" in:fly={{ y: 12, duration: 220 }}>
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-2">
<input
					class="w-full border-transparent bg-transparent text-2xl lg:text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground border-b-2 border-transparent focus:border-primary transition-colors duration-200 sm:max-w-2xl lg:max-w-3xl"
					bind:value={llmTitle}
					placeholder="Untitled LLM.txt"
				/>
				<Input
					class="w-full border-transparent bg-transparent text-sm lg:text-base text-muted-foreground focus-visible:bg-muted/30 px-0 sm:max-w-2xl lg:max-w-3xl"
					bind:value={llmLabel}
					placeholder="Add a short description"
				/>
			</div>
			<div class="flex flex-wrap items-center gap-3 sm:justify-end">
				<Button
					variant="outline"
					size="sm"
					class="rounded-full px-4 py-2 min-h-[44px] text-xs font-semibold transition-all duration-200 hover:bg-muted"
					onclick={() => goto('/ui/MoLOS-AI-Knowledge/prompts')}
				>
					Go back
				</Button>
			</div>
		</div>
	</header>

	<div class="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_380px]" in:fade={{ duration: 180 }}>
		<div class="space-y-6 xl:space-y-8">
			<section class="rounded-2xl border bg-card/80 p-6 lg:p-8 xl:p-10 shadow-sm" in:fly={{ y: 10, duration: 200 }}>
				<div class="flex items-center justify-between">
					<h3 class="text-sm lg:text-base font-semibold">LLM.txt content</h3>
					<span class="text-xs text-muted-foreground">Main draft</span>
				</div>
				<Textarea
					class="mt-4 min-h-[320px] w-full rounded-xl border-2 border-muted bg-background p-4 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
					bind:value={llmContent}
					placeholder="LLM.txt content"
				/>
			</section>
		</div>

		<aside class="space-y-4 xl:space-y-5">
			<section class="rounded-2xl border bg-card/80 p-5 lg:p-6 shadow-sm" in:fly={{ y: 10, duration: 200 }}>
				<h3 class="text-sm font-semibold">Version</h3>
				<div class="mt-4 flex items-center justify-between text-sm">
					<div class="text-xs text-muted-foreground">Current</div>
					<div class="text-sm font-semibold">v{currentVersion}</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					class="mt-4 w-full rounded-full px-4 py-2 min-h-[44px] text-xs font-semibold transition-all duration-200 hover:bg-muted"
					onclick={() => {
						versionsOpen = true;
					}}
				>
					Show versions
				</Button>
			</section>

			<div class="rounded-2xl border bg-card/80 p-5 lg:p-6 shadow-sm" in:fly={{ y: 10, duration: 200 }}>
				<h3 class="text-sm font-semibold">Commit</h3>
				<div class="mt-4 grid gap-3">
					<Input
						class="h-11 w-full rounded-lg border-2 border-muted bg-background px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
						bind:value={llmCommit}
						placeholder="Commit message (optional)"
					/>
					<Button
						size="sm"
						class="rounded-full bg-foreground px-4 py-2 min-h-[44px] text-xs font-semibold text-background transition-all duration-200 hover:opacity-90"
						onclick={saveLlmFile}
					>
						{isNew ? 'Create LLM.txt' : 'Save changes'}
					</Button>
				</div>
			</div>

			<section class="rounded-2xl border bg-card/80 p-5 lg:p-6 shadow-sm" in:fly={{ y: 10, duration: 200 }}>
				<h3 class="text-sm font-semibold">Actions</h3>
				<div class="mt-4 flex flex-col gap-2">
					<Button
						variant="outline"
						size="sm"
						class="rounded-full px-4 py-2 min-h-[44px] text-xs font-semibold transition-all duration-200 hover:bg-muted"
						onclick={shareLlmFile}
						disabled={!fileId}
					>
						Share LLM.txt
					</Button>
					<Button
						variant="outline"
						size="sm"
						class="rounded-full px-4 py-2 min-h-[44px] text-xs font-semibold text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
						onclick={deleteLlmFile}
						disabled={!fileId}
					>
						Delete LLM.txt
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
			<p class="text-xs text-muted-foreground">{data.versions.length} total</p>
		</SheetHeader>
	<div class="flex-1 overflow-auto scroll-smooth px-5 py-4">
		<div class="space-y-3">
		{#if data.versions.length === 0}
			<p class="text-xs text-muted-foreground">No versions yet.</p>
		{:else}
			{#each data.versions as version}
				<div class="rounded-xl border-2 border-border/60 bg-background/70 p-3 transition-colors hover:border-border/80">
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
							<Button
								variant="outline"
								size="sm"
								class="rounded-full px-3 py-1.5 min-h-[36px] transition-all duration-200 hover:bg-muted"
								onclick={() => viewVersion(version)}
							>
								View
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="rounded-full px-3 py-1.5 min-h-[36px] transition-all duration-200 hover:bg-muted"
								onclick={() => restoreVersion(version)}
							>
								Restore
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="rounded-full px-3 py-1.5 min-h-[36px] text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
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
