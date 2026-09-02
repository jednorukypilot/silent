<script lang="ts">
	import { resolve } from '$app/paths';
	import type { WorksData } from '$lib/model/types';

	export let works: WorksData[] = [];
</script>

<div class="flex h-full w-full flex-col overflow-y-auto bg-white px-6 py-8 text-black">
	{#each works as work (work.id)}
		<a href={resolve(`/${work.id}`)} class="text-md py-2 transition-opacity hover:opacity-60">
			{work.title}
		</a>
	{/each}
</div>
