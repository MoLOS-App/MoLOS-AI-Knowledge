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
		class={`rounded-xl px-3 py-2 text-left text-sm transition ${
			!selectedSessionId
				? 'bg-muted/40 text-foreground'
				: 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
		}`}
	>
		<Button
			variant="ghost"
			size="sm"
			class="w-full justify-start text-left gap-2"
			type="button"
			onclick={startNewConversation}
		>
			<span class="inline-flex h-1.5 w-1.5 rounded-full bg-primary/60"></span>
			<div class="text-xs font-semibold">New conversation</div>
		</Button>
	</div>

	{#each sessions as session}
		<div
			class={`rounded-xl px-3 py-2 transition ${
				selectedSessionId === session.id
					? 'bg-muted/40 text-foreground'
					: 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
			}`}
		>
			<div class="flex flex-col items-start justify-between gap-2">
				{#if editingSessionId === session.id}
					<div class="flex-1 min-w-0 w-full">
						<Input
							class="w-full h-8 px-2 text-sm rounded-md bg-background/60"
							bind:value={renameDraft}
						/>
						<div class="mt-1 text-[11px] text-muted-foreground">
							{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
						</div>
					</div>
					<div class="flex w-full items-center gap-1 text-[10px] text-muted-foreground">
						<Button
							variant="outline"
							size="sm"
							class="px-2 py-1 rounded-md text-foreground"
							type="button"
							onclick={() => saveRename(session)}
						>
							Save
						</Button>
						<Button
							variant="ghost"
							size="sm"
							class="px-2 py-1 rounded-md"
							type="button"
							onclick={cancelRename}
						>
							Cancel
						</Button>
					</div>
				{:else}
					<div class="flex w-full items-start justify-between gap-2">
						<Button
							variant="ghost"
							size="sm"
							class="flex-1 min-w-0 justify-start text-left gap-2"
							type="button"
							onclick={() => selectSession(session)}
						>
							<span
								class={`mt-1 inline-flex h-1.5 w-1.5 rounded-full ${
									selectedSessionId === session.id ? 'bg-primary/70' : 'bg-muted-foreground/50'
								}`}
							></span>
							<div class="min-w-0">
								<div class="text-xs font-semibold truncate">{sessionTitle(session)}</div>
								<div class="mt-0.5 text-[11px] text-muted-foreground">
									{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
								</div>
							</div>
						</Button>
						<div class="flex shrink-0 flex-col gap-1 text-[10px] text-muted-foreground">
							<Button
								variant="ghost"
								size="sm"
								class="px-2 py-1 rounded-md"
								type="button"
								onclick={() => beginRename(session)}
							>
								Rename
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="px-2 py-1 rounded-md text-destructive"
								type="button"
								onclick={() => requestDeleteSession(session)}
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
		<div class="px-3 py-6 text-xs text-muted-foreground">
			No conversations yet.
			<div class="mt-1 text-[11px] text-muted-foreground/60">Start one to see it here.</div>
		</div>
	{/if}
</div>
