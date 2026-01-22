<script lang="ts">
	export let data;

	const { stats, recent, analytics } = data;

	const formatTime = (value: number | null) => {
		if (!value) return 'No activity yet';
		return new Date(value * 1000).toLocaleString();
	};

	const formatNumber = (value: number) =>
		new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(value);

	const sumRecentTokens = recent.sessions.reduce(
		(total, session) => total + (session.totalTokens ?? 0),
		0
	);
	const sumRecentCost = recent.sessions.reduce(
		(total, session) => total + (session.totalCost ?? 0),
		0
	);
	const avgRecentLatency = (() => {
		const latencyValues = recent.sessions
			.map((session) => session.latencyMs)
			.filter((value) => typeof value === 'number') as number[];
		if (!latencyValues.length) return null;
		return Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length);
	})();
	const avgRecentConfidence = (() => {
		if (!recent.jobs.length) return null;
		return (
			recent.jobs.reduce((sum, job) => sum + (job.confidenceScore ?? 0), 0) /
			recent.jobs.length
		);
	})();

	const latestModel = recent.sessions[0]?.model ?? null;
</script>

<div class="space-y-8">
	<section class="p-6 border shadow-sm rounded-3xl bg-card/80">
		<div class="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-semibold tracking-tight">MoLOS AI Knowledge</h2>
				</div>
				<p class="text-sm text-muted-foreground">
					Monitor prompt libraries, playground experiments, and humanizer output quality in one
					view.
				</p>
				<div class="flex flex-wrap gap-2">
					<a
						href="/ui/MoLOS-AI-Knowledge/prompts"
						class="px-4 py-2 text-xs font-semibold rounded-full bg-foreground text-background"
					>
						Manage prompts
					</a>
					<a
						href="/ui/MoLOS-AI-Knowledge/playground"
						class="px-4 py-2 text-xs font-semibold border rounded-full text-foreground"
					>
						Open playground
					</a>
					<a
						href="/ui/MoLOS-AI-Knowledge/humanizer"
						class="px-4 py-2 text-xs font-semibold border rounded-full text-foreground"
					>
						Humanizer runs
					</a>
				</div>
			</div>
			<div class="relative p-6 overflow-hidden border border-dashed rounded-3xl border-primary">
				<div class="space-y-2">
					<div class="text-2xl font-semibold">
						{stats.promptsTotal + stats.sessionsTotal + stats.jobsTotal}
					</div>
					<div class="text-foreground/70">Total AI knowledge artifacts</div>
				</div>
				<div class="grid gap-3 mt-6">
					<div class="flex items-center justify-between px-3 py-2 rounded-xl bg-primary-foreground/10">
						<span>Recent tokens</span>
						<span class="font-semibold">{formatNumber(sumRecentTokens)}</span>
					</div>
					<div class="flex items-center justify-between px-3 py-2 rounded-xl bg-primary-foreground/10">
						<span>Recent cost</span>
						<span class="font-semibold">{formatCurrency(sumRecentCost)}</span>
					</div>
					<div class="flex items-center justify-between px-3 py-2 rounded-xl bg-primary-foreground/10">
						<span>Avg latency</span>
						<span class="font-semibold">{avgRecentLatency ? `${avgRecentLatency} ms` : '—'}</span>
					</div>
				</div>
				<div class="absolute w-40 h-40 rounded-full pointer-events-none -right-6 -top-10 bg-primary-foreground/10"></div>
				<div class="absolute w-56 h-56 rounded-full pointer-events-none -bottom-12 -right-10 bg-primary-foreground/10"></div>
			</div>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<div class="p-5 border rounded-2xl bg-card">
			<div class="text-xs uppercase text-muted-foreground">Prompts</div>
			<div class="mt-2 text-2xl font-semibold">{stats.promptsTotal}</div>
			<div class="text-xs text-muted-foreground">Library size</div>
		</div>
		<div class="p-5 border rounded-2xl bg-card">
			<div class="text-xs uppercase text-muted-foreground">Playground</div>
			<div class="mt-2 text-2xl font-semibold">{stats.sessionsTotal}</div>
			<div class="text-xs text-muted-foreground">Conversations saved</div>
		</div>
		<div class="p-5 border rounded-2xl bg-card">
			<div class="text-xs uppercase text-muted-foreground">Humanizer</div>
			<div class="mt-2 text-2xl font-semibold">{stats.jobsTotal}</div>
			<div class="text-xs text-muted-foreground">Transformations</div>
		</div>
		<div class="p-5 border rounded-2xl bg-card">
			<div class="text-xs uppercase text-muted-foreground">Latest model</div>
			<div class="mt-2 text-xl font-semibold">{latestModel ?? '—'}</div>
			<div class="text-xs text-muted-foreground">Most recent session</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr]">
		<div class="p-6 border rounded-2xl bg-card">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold">Recent Prompts</h3>
				<a
					href="/ui/MoLOS-AI-Knowledge/prompts"
					class="text-xs font-semibold text-muted-foreground hover:text-foreground"
				>
					See all
				</a>
			</div>
			<div class="mt-4 space-y-3">
				{#each recent.prompts as prompt}
					<div class="p-3 border rounded-xl">
						<div class="text-sm font-semibold">{prompt.title}</div>
						<div class="text-xs text-muted-foreground">
							Updated {formatTime(prompt.updatedAt)}
						</div>
					</div>
				{/each}
				{#if recent.prompts.length === 0}
					<div class="p-6 text-sm border border-dashed rounded-xl text-muted-foreground">
						No prompts created yet.
					</div>
				{/if}
			</div>
		</div>
		<div class="p-6 border rounded-2xl bg-card">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold">Quick Access</h3>
				<span class="text-xs text-muted-foreground">Most used</span>
			</div>
			<div class="grid gap-3 mt-4">
				<a
					href="/ui/MoLOS-AI-Knowledge/prompts"
					class="flex items-center justify-between p-4 text-sm font-semibold transition border rounded-xl hover:bg-muted/20"
				>
					<span>Prompt Library</span>
					<span class="text-xs text-muted-foreground">{stats.promptsTotal} prompts</span>
				</a>
				<a
					href="/ui/MoLOS-AI-Knowledge/playground"
					class="flex items-center justify-between p-4 text-sm font-semibold transition border rounded-xl hover:bg-muted/20"
				>
					<span>Playground Sessions</span>
					<span class="text-xs text-muted-foreground">{stats.sessionsTotal} sessions</span>
				</a>
				<a
					href="/ui/MoLOS-AI-Knowledge/humanizer"
					class="flex items-center justify-between p-4 text-sm font-semibold transition border rounded-xl hover:bg-muted/20"
				>
					<span>Humanizer Runs</span>
					<span class="text-xs text-muted-foreground">{stats.jobsTotal} jobs</span>
				</a>
				<a
					href="/ui/MoLOS-AI-Knowledge/analytics"
					class="flex items-center justify-between p-4 text-sm font-semibold transition border rounded-xl hover:bg-muted/20"
				>
					<span>Analytics</span>
					<span class="text-xs text-muted-foreground">Insights</span>
				</a>
			</div>
		</div>
		<div class="p-6 border rounded-2xl bg-card">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold">Library Health</h3>
				<span class="text-xs text-muted-foreground">Recent activity</span>
			</div>
			<div class="grid gap-3 mt-4">
				<div class="p-4 border border-dashed rounded-xl">
					<div class="text-xs uppercase text-muted-foreground">Recent tokens</div>
					<div class="mt-1 text-2xl font-semibold">{formatNumber(sumRecentTokens)}</div>
					<div class="text-xs text-muted-foreground">Last 5 sessions</div>
				</div>
				<div class="p-4 border border-dashed rounded-xl">
					<div class="text-xs uppercase text-muted-foreground">Avg confidence</div>
					<div class="mt-1 text-2xl font-semibold">
						{avgRecentConfidence !== null ? `${avgRecentConfidence.toFixed(1)}%` : '—'}
					</div>
					<div class="text-xs text-muted-foreground">Last 5 jobs</div>
				</div>
				<div class="p-4 border border-dashed rounded-xl">
					<div class="text-xs uppercase text-muted-foreground">Latest model</div>
					<div class="mt-1 text-2xl font-semibold">{latestModel ?? '—'}</div>
					<div class="text-xs text-muted-foreground">Most recent session</div>
				</div>
			</div>
		</div>
	</section>

	<section class="p-6 border rounded-2xl bg-card">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold">Analytics Highlights</h3>
			<a
				href="/ui/MoLOS-AI-Knowledge/analytics"
				class="text-xs font-semibold text-muted-foreground hover:text-foreground"
			>
				Open analytics
			</a>
		</div>
		<div class="grid gap-3 mt-4 md:grid-cols-2 lg:grid-cols-3">
			{#each analytics as metric}
				<div class="p-4 border rounded-xl">
					<div class="text-xs uppercase text-muted-foreground">{metric.metricType}</div>
					<div class="text-lg font-semibold">{metric.value}</div>
					<div class="text-xs text-muted-foreground">{metric.entityType}</div>
				</div>
			{/each}
			{#if analytics.length === 0}
				<div class="p-6 text-sm border border-dashed rounded-xl text-muted-foreground">
					Analytics will appear after activity is recorded.
				</div>
			{/if}
		</div>
	</section>
</div>
