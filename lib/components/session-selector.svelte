<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { PlaygroundSession } from '$lib/models/external_modules/MoLOS-AI-Knowledge';

	export let sessions: PlaygroundSession[] = [];
	export let selectedSessionId = '';
	export let editingSessionId = '';
	export let renameDraft = '';
	export let sessionTitle: (session: PlaygroundSession) => string;
	export let startNewConversation: () => void;
	export let selectSession: (session: PlaygroundSession) => void;
	export let beginRename: (session: PlaygroundSession) => void;
	export let cancelRename: () => void;
	export let saveRename: (session: PlaygroundSession) => void;
	export let requestDeleteSession: (session: PlaygroundSession) => void;
</script>

<div class="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4 pr-3">
	<div
		class={`min-h-[56px] rounded-xl px-4 py-3 text-left text-sm transition-all duration-200 ${
			!selectedSessionId
				? 'border-2 border-primary/30 bg-primary/10 text-foreground shadow-sm'
				: 'text-muted-foreground border-2 border-transparent hover:bg-muted/20 hover:text-foreground'
		}`}
	>
		<Button
			variant="ghost"
			size="sm"
			class="min-h-[44px] w-full justify-start gap-2 text-left"
			type="button"
			onclick={startNewConversation}
		>
			<span class="inline-flex h-2 w-2 rounded-full bg-primary/60"></span>
			<div class="text-xs font-semibold">New conversation</div>
		</Button>
	</div>

	{#each sessions as session}
		<div
			class={`min-h-[56px] rounded-xl px-4 py-3 transition-all duration-200 ${
				selectedSessionId === session.id
					? 'border-2 border-primary/30 bg-primary/10 text-foreground shadow-sm'
					: 'text-muted-foreground border-2 border-transparent hover:bg-muted/20 hover:text-foreground'
			}`}
		>
			<div class="flex flex-col items-start justify-between gap-2">
				{#if editingSessionId === session.id}
					<div class="w-full min-w-0 flex-1">
						<Input
							class="h-10 w-full rounded-lg bg-background/60 px-3 text-sm focus-visible:ring-2 focus-visible:ring-primary"
							bind:value={renameDraft}
						/>
						<div class="text-muted-foreground mt-1.5 text-[11px]">
							{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
						</div>
					</div>
					<div class="flex w-full items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							class="min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 font-medium text-foreground transition-all duration-200 hover:bg-muted"
							type="button"
							onclick={() => saveRename(session)}
						>
							Save
						</Button>
						<Button
							variant="ghost"
							size="sm"
							class="min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 transition-all duration-200 hover:bg-muted"
							type="button"
							onclick={cancelRename}
						>
							Cancel
						</Button>
					</div>
				{:else}
					<div
						class="flex w-full items-start justify-between gap-2"
						role="button"
						tabindex="0"
						onclick={() => selectSession(session)}
						onkeydown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								selectSession(session);
							}
						}}
					>
						<div class="flex min-w-0 flex-1 items-start gap-2">
							<span
								class={`mt-1.5 inline-flex h-2 w-2 rounded-full ${
									selectedSessionId === session.id ? 'bg-primary/70' : 'bg-muted-foreground/50'
								}`}
							></span>
							<div class="min-w-0">
								<div class="truncate text-xs font-semibold">{sessionTitle(session)}</div>
								<div class="text-muted-foreground mt-0.5 text-[11px]">
									{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
								</div>
							</div>
						</div>
						<div class="flex shrink-0 flex-col gap-1.5">
							<Button
								variant="ghost"
								size="sm"
								class="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-muted hover:text-foreground"
								type="button"
								onclick={(event) => {
									event.stopPropagation();
									beginRename(session);
								}}
							>
								Rename
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-xs font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
								type="button"
								onclick={(event) => {
									event.stopPropagation();
									requestDeleteSession(session);
								}}
							>
								Delete
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/each}

	{#if sessions.length === 0}
		<div class="px-4 py-12 text-center">
			<p class="text-muted-foreground mb-1 text-sm font-medium">No conversations yet</p>
			<p class="text-muted-foreground/70 text-xs">Start one to see it here</p>
		</div>
	{/if}
</div>
