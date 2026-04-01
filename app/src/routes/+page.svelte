<script lang="ts">
	import { page } from '$app/state';
	import ScrollableTiles from '$lib/components/home/ScrollableTiles.svelte';
	import OverlayHero from '$lib/components/OverlayHero.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	type HeroPageState = { skipHero?: boolean };

	const shouldShowHero = $derived(!Boolean((page.state as HeroPageState | undefined)?.skipHero));

	function handleIntroDone() {}
</script>

<div class="absolute top-16 right-0 bottom-0 left-0 overflow-hidden">
	{#if shouldShowHero}
		<OverlayHero onIntroDone={handleIntroDone} />
	{/if}
	<ScrollableTiles tileData={data.tiles} />
</div>
