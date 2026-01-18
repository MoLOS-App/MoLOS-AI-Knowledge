<script lang="ts">
	export let data;

	const { stats, recent, analytics } = data;

	const formatTime = (value: number | null) => {
		if (!value) return 'No activity yet';
		return new Date(value * 1000).toLocaleString();
	};
</script>

<div class="space-y-8">
	<section class="rounded-2xl border bg-card p-6">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-2xl font-semibold tracking-tight">Dashboard</h2>
				<p class="text-sm text-muted-foreground">
					Snapshot of prompt activity, sessions, and humanizer runs.
				</p>
			</div>
			<div class="rounded-xl border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
				Last activity: {formatTime(stats.lastActivity)}
			</div>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-2xl border bg-card p-5">
			<div class="text-xs uppercase text-muted-foreground">Prompts</div>
			<div class="mt-2 text-2xl font-semibold">{stats.promptsTotal}</div>
		</div>
		<div class="rounded-2xl border bg-card p-5">
			<div class="text-xs uppercase text-muted-foreground">Favorites</div>
			<div class="mt-2 text-2xl font-semibold">{stats.favorites}</div>
		</div>
		<div class="rounded-2xl border bg-card p-5">
			<div class="text-xs uppercase text-muted-foreground">Sessions</div>
			<div class="mt-2 text-2xl font-semibold">{stats.sessionsTotal}</div>
		</div>
		<div class="rounded-2xl border bg-card p-5">
			<div class="text-xs uppercase text-muted-foreground">Humanizer Jobs</div>
			<div class="mt-2 text-2xl font-semibold">{stats.jobsTotal}</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-3">
		<div class="rounded-2xl border bg-card p-6">
			<h3 class="text-lg font-semibold">Recent Prompts</h3>
			<div class="mt-4 space-y-3">
				{#each recent.prompts as prompt}
					<div class="rounded-xl border p-3">
						<div class="text-sm font-semibold">{prompt.title}</div>
						<div class="text-xs text-muted-foreground">
							{prompt.category} • {prompt.modelTarget}
						</div>
					</div>
				{/each}
				{#if recent.prompts.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No prompts created yet.
					</div>
				{/if}
			</div>
		</div>
		<div class="rounded-2xl border bg-card p-6">
			<h3 class="text-lg font-semibold">Recent Sessions</h3>
			<div class="mt-4 space-y-3">
				{#each recent.sessions as session}
					<div class="rounded-xl border p-3">
						<div class="text-sm font-semibold">{session.model}</div>
						<div class="text-xs text-muted-foreground">
							Tokens: {session.totalTokens} • Cost: ${session.totalCost}
						</div>
					</div>
				{/each}
				{#if recent.sessions.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No playground sessions yet.
					</div>
				{/if}
			</div>
		</div>
		<div class="rounded-2xl border bg-card p-6">
			<h3 class="text-lg font-semibold">Recent Humanizer Jobs</h3>
			<div class="mt-4 space-y-3">
				{#each recent.jobs as job}
					<div class="rounded-xl border p-3">
						<div class="text-sm font-semibold">{job.tone} • {job.level}</div>
						<div class="text-xs text-muted-foreground">
							Confidence: {job.confidenceScore}%
						</div>
					</div>
				{/each}
				{#if recent.jobs.length === 0}
					<div class="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
						No humanizer jobs yet.
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="rounded-2xl border bg-card p-6">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold">Analytics Highlights</h3>
		</div>
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
</div>
