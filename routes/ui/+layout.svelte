<script lang="ts">
	let { children } = $props();
</script>

<div class="flex h-full flex-col">
	<div class="flex-1 overflow-auto">
		<div class="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
			{@render children()}
		</div>
	</div>
</div>
