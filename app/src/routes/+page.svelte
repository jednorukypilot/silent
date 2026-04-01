<script lang="ts">
	import { page } from '$app/state';
	import HorizontalWorkViewer from '$lib/components/home/HorizontalWorkViewer.svelte';
	import ScrollableTiles from '$lib/components/home/ScrollableTiles.svelte';
	import OverlayHero from '$lib/components/OverlayHero.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	type HeroPageState = { skipHero?: boolean };

	const shouldShowHero = $derived(!Boolean((page.state as HeroPageState | undefined)?.skipHero));

	function handleIntroDone() {}
</script>

<div class="absolute top-16 right-0 bottom-0 left-0 overflow-hidden">
	{#if shouldShowHero}
		<OverlayHero onIntroDone={handleIntroDone} />
	{/if}
	<div class="hidden h-full w-full md:block">
		<ScrollableTiles tileData={data.tiles} />
	</div>
	<div class="block h-full w-full md:hidden">
		<HorizontalWorkViewer tileData={data.tiles} />
	</div>
</div>
