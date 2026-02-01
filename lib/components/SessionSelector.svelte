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
		class={`rounded-xl px-3 py-2 text-left text-sm transition ${
			!selectedSessionId
				? 'bg-muted/40 text-foreground'
				: 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
		}`}
	>
		<Button
			variant="ghost"
			size="sm"
			class="w-full justify-start gap-2 text-left"
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
					: 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
			}`}
		>
			<div class="flex flex-col items-start justify-between gap-2">
				{#if editingSessionId === session.id}
					<div class="w-full min-w-0 flex-1">
						<Input
							class="h-8 w-full rounded-md bg-background/60 px-2 text-sm"
							bind:value={renameDraft}
						/>
						<div class="text-muted-foreground mt-1 text-[11px]">
							{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
						</div>
					</div>
					<div class="text-muted-foreground flex w-full items-center gap-1 text-[10px]">
						<Button
							variant="outline"
							size="sm"
							class="rounded-md px-2 py-1 text-foreground"
							type="button"
							onclick={() => saveRename(session)}
						>
							Save
						</Button>
						<Button
							variant="ghost"
							size="sm"
							class="rounded-md px-2 py-1"
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
							class="min-w-0 flex-1 justify-start gap-2 text-left"
							type="button"
							onclick={() => selectSession(session)}
						>
							<span
								class={`mt-1 inline-flex h-1.5 w-1.5 rounded-full ${
									selectedSessionId === session.id ? 'bg-primary/70' : 'bg-muted-foreground/50'
								}`}
							></span>
							<div class="min-w-0">
								<div class="truncate text-xs font-semibold">{sessionTitle(session)}</div>
								<div class="text-muted-foreground mt-0.5 text-[11px]">
									{session.model} • Tokens: {session.totalTokens} • ${session.totalCost}
								</div>
							</div>
						</Button>
						<div class="text-muted-foreground flex shrink-0 flex-col gap-1 text-[10px]">
							<Button
								variant="ghost"
								size="sm"
								class="rounded-md px-2 py-1"
								type="button"
								onclick={() => beginRename(session)}
							>
								Rename
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="rounded-md px-2 py-1 text-destructive"
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
		<div class="text-muted-foreground px-3 py-6 text-xs">
			No conversations yet.
			<div class="text-muted-foreground/60 mt-1 text-[11px]">Start one to see it here.</div>
		</div>
	{/if}
</div>
