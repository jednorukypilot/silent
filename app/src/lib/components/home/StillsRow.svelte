<script lang="ts">
	import type { WorksData } from '$lib/model/types';

	export let tile: WorksData;
</script>

<div class="flex h-82 w-full items-start justify-start bg-gray-500 p-4 text-white">
	<div class="flex flex-col gap-2">
		<h2 class="text-2xl font-semibold">{tile.title}</h2>
		{#if tile.year}
			<p class="text-sm text-gray-200">{tile.year}</p>
		{/if}
		{#if tile.description}
			<p class="max-w-2xl text-sm text-gray-100">{tile.description}</p>
		{/if}
	</div>
</div>
