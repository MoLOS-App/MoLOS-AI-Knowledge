<script lang="ts">
	let { children } = $props();
</script>

<div class="flex flex-col h-full">
	<div class="flex-1 overflow-auto scroll-smooth">
		<div class="w-full h-full p-4 mx-auto max-w-[2560px] md:p-6 lg:px-10 lg:py-8 xl:px-12 xl:py-10 2xl:px-16 2xl:py-12">
			{@render children()}
		</div>
	</div>
</div>
