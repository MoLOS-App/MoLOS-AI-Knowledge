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
			recent.jobs.reduce((sum, job) => sum + (job.confidenceScore ?? 0), 0) / recent.jobs.length
		);
	})();

	const latestModel = recent.sessions[0]?.model ?? null;
</script>

<svelte:head>
	<title>MoLOS AI Knowledge - Home</title>
	<meta
		name="description"
		content="Monitor prompt libraries, playground experiments, and humanizer output quality."
	/>
</svelte:head>

<div class="space-y-8 xl:space-y-10">
	<section class="rounded-2xl border bg-card/80 p-6 shadow-sm lg:p-8 xl:p-10">
		<div class="grid gap-6 md:grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[1.6fr_1fr]">
			<div class="flex flex-col gap-4 xl:gap-5">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-semibold tracking-tight lg:text-3xl">MoLOS AI Knowledge</h2>
				</div>
				<p class="text-muted-foreground text-sm lg:text-base">
					Monitor prompt libraries, playground experiments, and humanizer output quality in one
					view.
				</p>
				<div class="flex flex-wrap gap-2 lg:gap-3">
					<a
						href="/ui/MoLOS-AI-Knowledge/prompts"
						class="inline-flex min-h-[44px] items-center rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-all duration-200 hover:opacity-90 lg:px-5 lg:py-2.5 lg:text-sm xl:px-6 xl:py-3"
					>
						Manage prompts
					</a>
					<a
						href="/ui/MoLOS-AI-Knowledge/playground"
						class="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-muted lg:px-5 lg:py-2.5 lg:text-sm xl:px-6 xl:py-3"
					>
						Open playground
					</a>
					<a
						href="/ui/MoLOS-AI-Knowledge/humanizer"
						class="inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-xs font-semibold text-foreground transition-all duration-200 hover:bg-muted lg:px-5 lg:py-2.5 lg:text-sm xl:px-6 xl:py-3"
					>
						Humanizer runs
					</a>
				</div>
			</div>
			<div
				class="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 p-6"
			>
				<div class="space-y-2">
					<div class="text-2xl font-semibold">
						{stats.promptsTotal + stats.sessionsTotal + stats.jobsTotal}
					</div>
					<div class="text-foreground/70">Total AI knowledge artifacts</div>
				</div>
				<div class="mt-6 grid gap-3">
					<div
						class="flex items-center justify-between rounded-xl bg-primary-foreground/10 px-3 py-2"
					>
						<span>Recent tokens</span>
						<span class="font-semibold">{formatNumber(sumRecentTokens)}</span>
					</div>
					<div
						class="flex items-center justify-between rounded-xl bg-primary-foreground/10 px-3 py-2"
					>
						<span>Recent cost</span>
						<span class="font-semibold">{formatCurrency(sumRecentCost)}</span>
					</div>
					<div
						class="flex items-center justify-between rounded-xl bg-primary-foreground/10 px-3 py-2"
					>
						<span>Avg latency</span>
						<span class="font-semibold">{avgRecentLatency ? `${avgRecentLatency} ms` : '—'}</span>
					</div>
				</div>
				<div
					class="pointer-events-none absolute -top-10 -right-6 h-40 w-40 rounded-full bg-primary/10"
				></div>
				<div
					class="pointer-events-none absolute -right-10 -bottom-12 h-56 w-56 rounded-full bg-primary/10"
				></div>
			</div>
		</div>
	</section>

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-5">
		<div
			class="rounded-2xl border bg-card p-5 transition-all duration-200 hover:border-border/70 hover:shadow-md lg:p-6"
		>
			<div class="text-muted-foreground text-xs tracking-wide uppercase">Prompts</div>
			<div class="mt-2 text-2xl font-semibold lg:text-3xl">{stats.promptsTotal}</div>
			<div class="text-muted-foreground text-xs lg:text-sm">Library size</div>
		</div>
		<div
			class="rounded-2xl border bg-card p-5 transition-all duration-200 hover:border-border/70 hover:shadow-md lg:p-6"
		>
			<div class="text-muted-foreground text-xs tracking-wide uppercase">Playground</div>
			<div class="mt-2 text-2xl font-semibold lg:text-3xl">{stats.sessionsTotal}</div>
			<div class="text-muted-foreground text-xs lg:text-sm">Conversations saved</div>
		</div>
		<div
			class="rounded-2xl border bg-card p-5 transition-all duration-200 hover:border-border/70 hover:shadow-md lg:p-6"
		>
			<div class="text-muted-foreground text-xs tracking-wide uppercase">Humanizer</div>
			<div class="mt-2 text-2xl font-semibold lg:text-3xl">{stats.jobsTotal}</div>
			<div class="text-muted-foreground text-xs lg:text-sm">Transformations</div>
		</div>
		<div
			class="rounded-2xl border bg-card p-5 transition-all duration-200 hover:border-border/70 hover:shadow-md lg:p-6"
		>
			<div class="text-muted-foreground text-xs tracking-wide uppercase">Latest model</div>
			<div class="mt-2 text-xl font-semibold lg:text-2xl">{latestModel ?? '—'}</div>
			<div class="text-muted-foreground text-xs lg:text-sm">Most recent session</div>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.2fr_1fr_1fr]">
		<div class="rounded-2xl border bg-card p-6 lg:p-7 xl:p-8">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold lg:text-xl">Recent Prompts</h3>
				<a
					href="/ui/MoLOS-AI-Knowledge/prompts"
					class="text-muted-foreground text-xs font-semibold hover:text-foreground lg:text-sm"
				>
					See all
				</a>
			</div>
			<div class="mt-4 space-y-3">
				{#each recent.prompts as prompt}
					<div class="rounded-xl border p-3">
						<div class="text-sm font-semibold">{prompt.title}</div>
						<div class="text-muted-foreground text-xs">
							Updated {formatTime(prompt.updatedAt)}
						</div>
					</div>
				{/each}
				{#if recent.prompts.length === 0}
					<div class="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
						No prompts created yet.
					</div>
				{/if}
			</div>
		</div>
		<div class="rounded-2xl border bg-card p-6 lg:p-7 xl:p-8">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold lg:text-xl">Quick Access</h3>
				<span class="text-muted-foreground text-xs lg:text-sm">Most used</span>
			</div>
			<div class="mt-4 grid gap-3">
				<a
					href="/ui/MoLOS-AI-Knowledge/prompts"
					class="flex min-h-[52px] items-center justify-between rounded-xl border p-4 text-sm font-semibold transition-all duration-200 hover:border-border/70 hover:bg-muted/20"
				>
					<span>Prompt Library</span>
					<span class="text-muted-foreground text-xs">{stats.promptsTotal} prompts</span>
				</a>
				<a
					href="/ui/MoLOS-AI-Knowledge/playground"
					class="flex min-h-[52px] items-center justify-between rounded-xl border p-4 text-sm font-semibold transition-all duration-200 hover:border-border/70 hover:bg-muted/20"
				>
					<span>Playground Sessions</span>
					<span class="text-muted-foreground text-xs">{stats.sessionsTotal} sessions</span>
				</a>
				<a
					href="/ui/MoLOS-AI-Knowledge/humanizer"
					class="flex min-h-[52px] items-center justify-between rounded-xl border p-4 text-sm font-semibold transition-all duration-200 hover:border-border/70 hover:bg-muted/20"
				>
					<span>Humanizer Runs</span>
					<span class="text-muted-foreground text-xs">{stats.jobsTotal} jobs</span>
				</a>
				<a
					href="/ui/MoLOS-AI-Knowledge/analytics"
					class="flex min-h-[52px] items-center justify-between rounded-xl border p-4 text-sm font-semibold transition-all duration-200 hover:border-border/70 hover:bg-muted/20"
				>
					<span>Analytics</span>
					<span class="text-muted-foreground text-xs">Insights</span>
				</a>
			</div>
		</div>
		<div class="rounded-2xl border bg-card p-6 lg:p-7 xl:p-8">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold lg:text-xl">Library Health</h3>
				<span class="text-muted-foreground text-xs lg:text-sm">Recent activity</span>
			</div>
			<div class="mt-4 grid gap-3">
				<div class="rounded-xl border border-dashed p-4">
					<div class="text-muted-foreground text-xs uppercase">Recent tokens</div>
					<div class="mt-1 text-2xl font-semibold">{formatNumber(sumRecentTokens)}</div>
					<div class="text-muted-foreground text-xs">Last 5 sessions</div>
				</div>
				<div class="rounded-xl border border-dashed p-4">
					<div class="text-muted-foreground text-xs uppercase">Avg confidence</div>
					<div class="mt-1 text-2xl font-semibold">
						{avgRecentConfidence !== null ? `${avgRecentConfidence.toFixed(1)}%` : '—'}
					</div>
					<div class="text-muted-foreground text-xs">Last 5 jobs</div>
				</div>
				<div class="rounded-xl border border-dashed p-4">
					<div class="text-muted-foreground text-xs uppercase">Latest model</div>
					<div class="mt-1 text-2xl font-semibold">{latestModel ?? '—'}</div>
					<div class="text-muted-foreground text-xs">Most recent session</div>
				</div>
			</div>
		</div>
	</section>

	<section class="rounded-2xl border bg-card p-6 lg:p-8 xl:p-10">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold lg:text-xl">Analytics Highlights</h3>
			<a
				href="/ui/MoLOS-AI-Knowledge/analytics"
				class="text-muted-foreground text-xs font-semibold hover:text-foreground lg:text-sm"
			>
				Open analytics
			</a>
		</div>
		<div class="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each analytics as metric}
				<div class="rounded-xl border p-4">
					<div class="text-muted-foreground text-xs uppercase">{metric.metricType}</div>
					<div class="text-lg font-semibold">{metric.value}</div>
					<div class="text-muted-foreground text-xs">{metric.entityType}</div>
				</div>
			{/each}
			{#if analytics.length === 0}
				<div class="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
					Analytics will appear after activity is recorded.
				</div>
			{/if}
		</div>
	</section>
</div>
