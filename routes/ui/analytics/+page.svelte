<script lang="ts">
	export let data;

	let analytics = [];
	$: ({ analytics } = data);
</script>

<div class="space-y-6">
	<section class="rounded-2xl border bg-card p-6">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">Analytics</h2>
				<p class="text-sm text-muted-foreground">
					Track usage signals and performance metrics across the module.
				</p>
			</div>
			<div class="text-xs text-muted-foreground">Metrics refresh on page load.</div>
		</div>
	</section>

	<section class="rounded-2xl border bg-card p-6">
		<h3 class="text-lg font-semibold">Metric Cards</h3>
		<div class="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each analytics as metric}
				<div class="rounded-xl border p-4">
					<div class="text-xs uppercase text-muted-foreground">{metric.metricType}</div>
					<div class="text-lg font-semibold">{metric.value}</div>
					<div class="text-xs text-muted-foreground">{metric.entityType}</div>
				</div>
			{/each}
			{#if analytics.length === 0}
				<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
					Analytics will appear after activity is recorded.
				</div>
			{/if}
		</div>
	</section>

	<section class="rounded-2xl border bg-card p-6">
		<h3 class="text-lg font-semibold">Recent Usage</h3>
		<div class="mt-4 space-y-3">
			{#each analytics as metric}
				<div class="rounded-xl border p-4">
					<div class="text-sm font-semibold">{metric.entityType}</div>
					<div class="text-xs text-muted-foreground">
						{metric.metricType} • {metric.value}
					</div>
				</div>
			{/each}
			{#if analytics.length === 0}
				<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
					No usage records yet.
				</div>
			{/if}
		</div>
	</section>
</div>
