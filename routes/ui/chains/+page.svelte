<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { createPromptChain } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import type { PromptChain } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { PageData } from './$types';

	export let data: PageData;

	let chains: PromptChain[] = [];
	$: ({ chains } = data);

	let chainName = '';
	let chainDescription = '';
	let chainTags = '';
	let chainDefinition = '{"nodes":[],"edges":[]}';

	const saveChain = async () => {
		if (!chainName.trim()) return;
		await createPromptChain({
			name: chainName.trim(),
			description: chainDescription.trim() || undefined,
			definitionJson: chainDefinition.trim(),
			tags: chainTags
				.split(',')
				.map((tag) => tag.trim())
				.filter(Boolean)
		});
		await invalidateAll();
		chainName = '';
		chainDescription = '';
		chainTags = '';
		chainDefinition = '{"nodes":[],"edges":[]}';
	};
</script>

<div class="space-y-6">
	<section class="rounded-2xl border bg-card p-6">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">Prompt Chains</h2>
				<p class="text-sm text-muted-foreground">
					Build reusable multi-step prompt flows.
				</p>
			</div>
			<div class="text-xs text-muted-foreground">Keep definitions structured and shareable.</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
		<div class="rounded-2xl border bg-card p-6">
			<div class="space-y-3">
				{#each chains as chain}
					<div class="rounded-xl border p-4">
						<div class="text-sm font-semibold">{chain.name}</div>
						<div class="text-xs text-muted-foreground">{chain.description || 'No description'}</div>
					</div>
				{/each}
				{#if chains.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No chains created yet.
					</div>
				{/if}
			</div>
		</div>
		<div class="rounded-2xl border bg-card p-6">
			<h3 class="text-lg font-semibold">New Chain</h3>
			<div class="mt-4 grid gap-3">
				<Input
					class="h-10 rounded-md border bg-background px-3 text-sm"
					bind:value={chainName}
					placeholder="Chain name"
				/>
				<Input
					class="h-10 rounded-md border bg-background px-3 text-sm"
					bind:value={chainDescription}
					placeholder="Description"
				/>
				<Input
					class="h-10 rounded-md border bg-background px-3 text-sm"
					bind:value={chainTags}
					placeholder="Tags"
				/>
				<Textarea
					class="min-h-[120px] rounded-md border bg-background p-3 text-sm"
					bind:value={chainDefinition}
					placeholder="Chain definition JSON"
				/>
				<Button
					size="sm"
					class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
					onclick={saveChain}
				>
					Create chain
				</Button>
			</div>
		</div>
	</section>
</div>
