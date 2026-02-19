<script lang="ts">
	let { children } = $props();
</script>

<div class="flex h-full flex-col">
	<div class="flex-1 overflow-auto scroll-smooth">
		<div
			class="mx-auto h-full w-full max-w-[2560px] p-4 md:p-6 lg:px-10 lg:py-8 xl:px-12 xl:py-10 2xl:px-16 2xl:py-12"
		>
			{@render children()}
		</div>
	</div>
</div>
