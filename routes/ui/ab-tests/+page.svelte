<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { createAbTest, updateAbTest } from '$lib/stores/external_modules/MoLOS-AI-Knowledge/api';
	import {
		AbTestStatus,
		type AbTest
	} from '$lib/models/external_modules/MoLOS-AI-Knowledge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { NativeSelect, NativeSelectOption } from '$lib/components/ui/native-select';
	import type { PageData } from './$types';

	export let data: PageData;

	let tests: AbTest[] = [];
	$: ({ tests } = data);

	let activeTestId: string | null = null;
	let abTestName = '';
	let abPromptIds = '';
	let abDataset = '["Example input"]';
	let abStatus: AbTestStatus = AbTestStatus.DRAFT;
	let abResultsJson = '{}';

	const statusOptions = Object.values(AbTestStatus);

	const selectTest = (test: AbTest) => {
		activeTestId = test.id;
		abTestName = test.name;
		abPromptIds = safeIdsFromJson(test.promptIdsJson);
		abDataset = test.datasetJson;
		abStatus = test.status;
		abResultsJson = test.resultsJson;
	};

	const resetForm = () => {
		activeTestId = null;
		abTestName = '';
		abPromptIds = '';
		abDataset = '["Example input"]';
		abStatus = AbTestStatus.DRAFT;
		abResultsJson = '{}';
	};

	const saveTest = async () => {
		if (!abTestName.trim()) return;
		const ids = abPromptIds
			.split(',')
			.map((id) => id.trim())
			.filter(Boolean);
		const payload = {
			name: abTestName.trim(),
			promptIdsJson: JSON.stringify(ids),
			datasetJson: abDataset.trim(),
			resultsJson: abResultsJson || '{}',
			status: abStatus
		};

		if (activeTestId) {
			await updateAbTest(activeTestId, payload);
		} else {
			await createAbTest(payload);
		}

		await invalidateAll();
		resetForm();
	};

	const safeIdsFromJson = (value: string) => {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed.join(', ') : '';
		} catch {
			return '';
		}
	};
</script>

<div class="space-y-6">
	<section class="rounded-2xl border bg-card p-6">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">A/B Tests</h2>
				<p class="text-sm text-muted-foreground">
					Compare prompt variants and track results.
				</p>
			</div>
			<div class="text-xs text-muted-foreground">Set status to track experiment stage.</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
		<div class="rounded-2xl border bg-card p-6">
			<div class="space-y-3">
				{#each tests as test}
					<div class="rounded-xl border p-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm font-semibold">{test.name}</div>
								<div class="text-xs text-muted-foreground">Status: {test.status}</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								class="rounded-md px-3 py-1 text-xs"
								onclick={() => selectTest(test)}
							>
								Edit
							</Button>
						</div>
					</div>
				{/each}
				{#if tests.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No A/B tests yet.
					</div>
				{/if}
			</div>
		</div>
		<div class="rounded-2xl border bg-card p-6">
			<h3 class="text-lg font-semibold">{activeTestId ? 'Edit Test' : 'New Test'}</h3>
			<div class="mt-4 grid gap-3">
				<Input
					class="h-10 rounded-md border bg-background px-3 text-sm"
					bind:value={abTestName}
					placeholder="Test name"
				/>
				<Input
					class="h-10 rounded-md border bg-background px-3 text-sm"
					bind:value={abPromptIds}
					placeholder="Prompt IDs (comma separated)"
				/>
				<Textarea
					class="min-h-[120px] rounded-md border bg-background p-3 text-sm"
					bind:value={abDataset}
					placeholder="Dataset JSON"
				/>
				<NativeSelect
					class="h-10 rounded-md border bg-background px-3 text-sm"
					bind:value={abStatus}
				>
					{#each statusOptions as option}
						<NativeSelectOption value={option}>{option}</NativeSelectOption>
					{/each}
				</NativeSelect>
				<div class="flex gap-3">
					<Button
						size="sm"
						class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
						onclick={saveTest}
					>
						{activeTestId ? 'Save changes' : 'Create test'}
					</Button>
					<Button
						variant="outline"
						size="sm"
						class="rounded-md px-4 py-2 text-sm"
						onclick={resetForm}
					>
						Reset
					</Button>
				</div>
			</div>
		</div>
	</section>
</div>
