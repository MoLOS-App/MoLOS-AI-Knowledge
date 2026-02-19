<script lang="ts">
	let { children } = $props();
</script>

<div class="flex flex-col h-full">
	<div class="flex-1 overflow-auto">
		<div class="w-full h-full p-4 mx-auto md:p-6 lg:p-8">
			{@render children()}
		</div>
	</div>
</div>
