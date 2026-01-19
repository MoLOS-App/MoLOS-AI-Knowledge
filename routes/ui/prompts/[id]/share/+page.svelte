<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Prompt } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import { updatePrompt } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';

	export let data: { prompt: Prompt | null };

	let prompt: Prompt | null = null;
	let copied = false;

	$: prompt = data.prompt;
	$: shareUrl = `${$page.url.origin}${$page.url.pathname}`;
	$: isPublic = prompt ? !prompt.isPrivate : false;

	const toggleVisibility = async () => {
		if (!prompt) return;
		await updatePrompt(prompt.id, { isPrivate: prompt.isPrivate ? false : true });
		await invalidateAll();
	};

	const copyLink = async () => {
		if (!prompt) return;
		if (typeof navigator === 'undefined' || !navigator.clipboard) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			copied = false;
		}
	};
</script>

<div class="space-y-6">
	<section class="rounded-[28px] border bg-card/80 p-6 shadow-sm">
		<div class="flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-2xl font-semibold tracking-tight">Share prompt</h2>
					<p class="text-sm text-muted-foreground">
						Control visibility and copy a share link for public prompts.
					</p>
				</div>
				<button
					class="rounded-full border px-4 py-2 text-xs font-semibold text-foreground"
					onclick={() => goto('/ui/MoLOS-AI-Knowledge/prompts')}
				>
					Back to prompts
				</button>
			</div>

			{#if prompt}
				<div class="rounded-2xl border bg-background p-4">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<div class="text-sm font-semibold">{prompt.title}</div>
							<div class="text-xs text-muted-foreground">
								{prompt.category} • {prompt.modelTarget}
							</div>
						</div>
						<div class="flex items-center gap-2 text-xs">
							<span
								class={`rounded-full px-3 py-1 ${
									isPublic ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
								}`}
							>
								{isPublic ? 'Public' : 'Private'}
							</span>
							<button
								class="rounded-full border px-3 py-1"
								onclick={toggleVisibility}
							>
								{isPublic ? 'Make private' : 'Make public'}
							</button>
							{#if isPublic}
								<button class="rounded-full border px-3 py-1" onclick={copyLink}>
									{copied ? 'Copied' : 'Copy link'}
								</button>
							{/if}
						</div>
					</div>
					{#if prompt.description}
						<p class="mt-3 text-xs text-muted-foreground">{prompt.description}</p>
					{/if}
					<pre class="mt-4 whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-xs text-foreground">
{prompt.content}</pre
					>
					{#if prompt.tags.length}
						<div class="mt-4 flex flex-wrap gap-2">
							{#each prompt.tags as tag}
								<span class="rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase">
									{tag}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
					This prompt is not available. Make sure you are signed in or the link is valid.
				</div>
			{/if}
		</div>
	</section>
</div>
