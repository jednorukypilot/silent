<script lang="ts">
	import ScrollableTiles from '$lib/components/home/ScrollableTiles.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="absolute top-16 right-0 bottom-0 left-0 overflow-hidden">
	<ScrollableTiles tileData={data.tiles} />
</div>
