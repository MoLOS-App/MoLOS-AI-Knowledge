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
	import { NativeSelect, NativeSelectOption } from '$lib/components/ui/native-select';
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
	<div class="mx-auto max-w-5xl space-y-8 p-6 lg:p-8 xl:max-w-6xl xl:p-10">
		<div class="space-y-4 pt-4">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => goto('/ui/MoLOS-AI-Knowledge')}
				class="text-muted-foreground -ml-2 h-8 rounded-full px-3 text-[10px] font-bold tracking-widest uppercase hover:text-foreground lg:h-10 lg:px-4 lg:text-xs"
			>
				<ArrowLeft class="mr-2 h-3 w-3 lg:h-4 lg:w-4" />
				Back to AI Knowledge
			</Button>
			<div class="space-y-1">
				<h1 class="text-3xl font-black tracking-tighter lg:text-4xl">AI Provider Settings</h1>
				<p class="text-muted-foreground text-xs font-bold tracking-widest uppercase lg:text-sm">
					Configure the LLM provider for this module
				</p>
			</div>
		</div>

		<div class="grid gap-6 lg:gap-8">
			<Card class="rounded-2xl border-2 bg-card/80 shadow-sm">
				<CardHeader class="p-6 lg:p-8">
					<div class="flex items-center gap-3 lg:gap-4">
						<div class="rounded-xl bg-primary/10 p-2 text-primary shadow-xs lg:p-3">
							<Bot class="h-5 w-5 lg:h-6 lg:w-6" />
						</div>
						<div>
							<CardTitle class="text-lg lg:text-xl">Provider Configuration</CardTitle>
							<CardDescription class="text-xs lg:text-sm"
								>Select the LLM provider used in the playground.</CardDescription
							>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4 p-6 pt-0 lg:p-8">
					<div class="space-y-2">
						<Label for="provider">AI Provider</Label>
						<NativeSelect
							id="provider"
							bind:value={provider}
							class="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-11 w-full rounded-lg border-2 border-muted bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each providers as p (p.value)}
								<NativeSelectOption value={p.value}>{p.label}</NativeSelectOption>
							{/each}
						</NativeSelect>
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
							class="h-11 transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Preconfigured Models</Label>
						<div class="flex flex-wrap gap-2">
							{#if preconfiguredModels.length === 0}
								<div class="text-muted-foreground text-xs">No models configured yet.</div>
							{:else}
								{#each preconfiguredModels as model}
									<Button
										type="button"
										variant="outline"
										size="sm"
										class="min-h-[44px] rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
										onclick={() => removeModel(model)}
									>
										{model} ✕
									</Button>
								{/each}
							{/if}
						</div>
						<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
							<Input
								bind:value={newModel}
								placeholder="Add model id (e.g. gpt-4o-mini)"
								class="h-11 transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
								onkeydown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										addModel();
									}
								}}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								class="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-muted"
								onclick={addModel}
							>
								Add model
							</Button>
						</div>
						<p class="text-muted-foreground text-[10px]">
							These appear first in the playground model picker.
						</p>
					</div>
				</CardContent>
			</Card>

			<div class="flex justify-end">
				<Button
					size="default"
					onclick={handleSave}
					disabled={isSaving}
					class="rounded-xl px-8 py-3 text-sm font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
				>
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
