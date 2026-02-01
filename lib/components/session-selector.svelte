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

<div class="flex flex-col flex-1 gap-2 px-4 py-4 pr-3 overflow-y-auto">
	<div
		class={`rounded-xl px-4 py-3 min-h-[56px] text-left text-sm transition-all duration-200 ${
			!selectedSessionId
				? 'bg-primary/10 text-foreground border-2 border-primary/30 shadow-sm'
				: 'text-muted-foreground hover:text-foreground hover:bg-muted/20 border-2 border-transparent'
		}`}
	>
		<Button
			variant="ghost"
			size="sm"
			class="w-full justify-start text-left gap-2 min-h-[44px]"
			type="button"
			onclick={startNewConversation}
		>
			<span class="inline-flex h-2 w-2 rounded-full bg-primary/60"></span>
			<div class="text-xs font-semibold">New conversation</div>
		</Button>
	</div>

	{#each sessions as session}
		<div
			class={`rounded-xl px-4 py-3 min-h-[56px] transition-all duration-200 ${
				selectedSessionId === session.id
					? 'bg-primary/10 text-foreground border-2 border-primary/30 shadow-sm'
					: 'text-muted-foreground hover:text-foreground hover:bg-muted/20 border-2 border-transparent'
			}`}
		>
			<div class="flex flex-col items-start justify-between gap-2">
				{#if editingSessionId === session.id}
					<div class="flex-1 min-w-0 w-full">
						<Input
							class="w-full h-10 px-3 text-sm rounded-lg bg-background/60 focus-visible:ring-2 focus-visible:ring-primary"
							bind:value={renameDraft}
						/>
						<div class="mt-1.5 text-[11px] text-muted-foreground">
							{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
						</div>
					</div>
					<div class="flex w-full items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							class="px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg text-foreground font-medium transition-all duration-200 hover:bg-muted"
							type="button"
							onclick={() => saveRename(session)}
						>
							Save
						</Button>
						<Button
							variant="ghost"
							size="sm"
							class="px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 hover:bg-muted"
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
						<div class="flex-1 min-w-0 flex items-start gap-2">
							<span
								class={`mt-1.5 inline-flex h-2 w-2 rounded-full ${
									selectedSessionId === session.id ? 'bg-primary/70' : 'bg-muted-foreground/50'
								}`}
							></span>
							<div class="min-w-0">
								<div class="text-xs font-semibold truncate">{sessionTitle(session)}</div>
								<div class="mt-0.5 text-[11px] text-muted-foreground">
									{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
								</div>
							</div>
						</div>
						<div class="flex shrink-0 flex-col gap-1.5">
							<Button
								variant="ghost"
								size="sm"
								class="px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg text-xs font-medium transition-all duration-200 hover:bg-muted hover:text-foreground"
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
								class="px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg text-xs font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
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
			<p class="text-sm font-medium text-muted-foreground mb-1">No conversations yet</p>
			<p class="text-xs text-muted-foreground/70">Start one to see it here</p>
		</div>
	{/if}
</div>
