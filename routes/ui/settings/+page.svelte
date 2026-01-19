<script lang="ts">
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ArrowLeft, Save, Bot } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { AiProvider } from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import type { PageData } from './$types';

	const { data } = $props<PageData>();

	let provider = $state(AiProvider.OPENAI);
	let apiToken = $state('');
	let preconfiguredModels = $state<string[]>([]);
	let newModel = $state('');
	let isSaving = $state(false);

	$effect(() => {
		provider = data.settings?.provider ?? AiProvider.OPENAI;
		apiToken = data.settings?.apiToken ?? '';
		preconfiguredModels = data.settings?.preconfiguredModels ?? [];
	});

	const providers = [
		{ value: AiProvider.OPENAI, label: 'OpenAI' },
		{ value: AiProvider.ANTHROPIC, label: 'Anthropic' },
		{ value: AiProvider.OPENROUTER, label: 'OpenRouter' },
		{ value: AiProvider.XAI, label: 'xAI' }
	];

	function addModel() {
		const trimmed = newModel.trim();
		if (!trimmed) return;
		if (preconfiguredModels.includes(trimmed)) return;
		preconfiguredModels = [...preconfiguredModels, trimmed];
		newModel = '';
	}

	function removeModel(model: string) {
		preconfiguredModels = preconfiguredModels.filter((item) => item !== model);
	}

	async function handleSave() {
		isSaving = true;
		try {
			const res = await fetch('/api/MoLOS-AI-Knowledge/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ provider, apiToken, preconfiguredModels })
			});

			if (res.ok) {
				toast.success('AI provider updated');
			} else {
				toast.error('Failed to update provider');
			}
		} catch (err) {
			toast.error('Failed to update provider');
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="min-h-screen bg-background pb-20">
	<div class="mx-auto max-w-4xl space-y-8 p-6">
		<div class="space-y-4 pt-4">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => goto('/ui/MoLOS-AI-Knowledge')}
				class="text-muted-foreground -ml-2 h-8 rounded-full px-3 text-[10px] font-bold tracking-widest uppercase hover:text-foreground"
			>
				<ArrowLeft class="mr-2 h-3 w-3" />
				Back to AI Knowledge
			</Button>
			<div class="space-y-1">
				<h1 class="text-3xl font-black tracking-tighter">AI Provider Settings</h1>
				<p class="text-muted-foreground text-xs font-bold tracking-widest uppercase">
					Configure the LLM provider for this module
				</p>
			</div>
		</div>

		<div class="grid gap-6">
			<Card class="border-none shadow-sm">
				<CardHeader>
					<div class="flex items-center gap-3">
						<div class="rounded-xl bg-primary/10 p-2 text-primary shadow-xs">
							<Bot class="h-5 w-5" />
						</div>
						<div>
							<CardTitle>Provider Configuration</CardTitle>
							<CardDescription>Select the LLM provider used in the playground.</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="provider">AI Provider</Label>
						<select
							id="provider"
							bind:value={provider}
							class="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each providers as p (p.value)}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
						<p class="text-muted-foreground text-[10px]">
							This setting only affects models and requests inside AI Knowledge.
						</p>
					</div>
					<div class="space-y-2">
						<Label for="apiToken">API Token</Label>
						<Input
							id="apiToken"
							type="password"
							bind:value={apiToken}
							placeholder="Enter provider token"
						/>
						<p class="text-muted-foreground text-[10px]">
							The token is stored locally for this module.
						</p>
					</div>
					<div class="space-y-2">
						<Label>Preconfigured Models</Label>
						<div class="flex flex-wrap gap-2">
							{#if preconfiguredModels.length === 0}
								<div class="text-muted-foreground text-xs">
									No models configured yet.
								</div>
							{:else}
								{#each preconfiguredModels as model}
									<button
										type="button"
										class="rounded-full border px-3 py-1 text-xs"
										onclick={() => removeModel(model)}
									>
										{model} ✕
									</button>
								{/each}
							{/if}
						</div>
						<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
							<Input
								bind:value={newModel}
								placeholder="Add model id (e.g. gpt-4o-mini)"
								onkeydown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										addModel();
									}
								}}
							/>
							<button
								type="button"
								class="rounded-md border px-4 py-2 text-sm"
								onclick={addModel}
							>
								Add model
							</button>
						</div>
						<p class="text-muted-foreground text-[10px]">
							These appear first in the playground model picker.
						</p>
					</div>
				</CardContent>
			</Card>

			<div class="flex justify-end">
				<Button onclick={handleSave} disabled={isSaving} class="rounded-xl px-8 font-bold">
					{#if isSaving}
						Saving...
					{:else}
						<Save class="mr-2 h-4 w-4" />
						Save Configuration
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>
