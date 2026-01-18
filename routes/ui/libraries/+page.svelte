<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { createSharedLibrary } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';

	export let data;

	let libraries = [];
	$: ({ libraries } = data);

	let libraryName = '';
	let libraryDescription = '';
	let libraryPrivate = true;

	const saveLibrary = async () => {
		if (!libraryName.trim()) return;
		await createSharedLibrary({
			name: libraryName.trim(),
			description: libraryDescription.trim() || undefined,
			isPrivate: libraryPrivate
		});
		await invalidate();
		libraryName = '';
		libraryDescription = '';
		libraryPrivate = true;
	};
</script>

<div class="space-y-6">
	<section class="rounded-2xl border bg-card p-6">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">Shared Libraries</h2>
				<p class="text-sm text-muted-foreground">
					Collect prompts into shared or private libraries.
				</p>
			</div>
			<div class="text-xs text-muted-foreground">Use private for sensitive drafts.</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
		<div class="rounded-2xl border bg-card p-6">
			<div class="space-y-3">
				{#each libraries as library}
					<div class="rounded-xl border p-4">
						<div class="text-sm font-semibold">{library.name}</div>
						<div class="text-xs text-muted-foreground">
							{library.isPrivate ? 'Private' : 'Shared'}
						</div>
					</div>
				{/each}
				{#if libraries.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No shared libraries yet.
					</div>
				{/if}
			</div>
		</div>
		<div class="rounded-2xl border bg-card p-6">
			<h3 class="text-lg font-semibold">New Library</h3>
			<div class="mt-4 grid gap-3">
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
				<button
					class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
					onclick={saveLibrary}
				>
					Create library
				</button>
			</div>
		</div>
	</section>
</div>
