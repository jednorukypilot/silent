<script lang="ts">
	import { resolve } from '$app/paths';
	import type { WorksData } from '$lib/model/types';

	let { works = [] }: { works: WorksData[] } = $props();
</script>

<div class="flex h-full w-full flex-col overflow-y-auto bg-white px-6 py-8">
	{#each works as work (work.id)}
		<a href={resolve(`/${work.id}`)} class="text-md mt-2.5 block text-left transition-all">
			{work.title}
		</a>
	{/each}
</div>

<style>
	a {
		font-weight: 100;
	}

	a:hover,
	a:focus {
		font-weight: 390;
	}
</style>
