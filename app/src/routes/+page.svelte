<script lang="ts">
	import ScrollableTiles from '$lib/components/home/ScrollableTiles.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<ScrollableTiles tileData={data.tiles} />
