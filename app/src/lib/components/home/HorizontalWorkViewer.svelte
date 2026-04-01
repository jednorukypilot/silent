<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import type { WorksData } from '$lib/model/types';
	import { onMount } from 'svelte';

	export let tileData: WorksData[] = [];

	const fallbackAspectRatio = 16 / 9;

	let viewport: HTMLDivElement | null = null;
	let activeIndex = 0;

	function clampIndex(index: number) {
		if (tileData.length === 0) return 0;
		return Math.max(0, Math.min(tileData.length - 1, index));
	}

	function setActiveSlideFromScroll() {
		if (!viewport || tileData.length === 0) return;
		const slideWidth = viewport.clientWidth;
		if (slideWidth === 0) return;

		activeIndex = clampIndex(Math.round(viewport.scrollLeft / slideWidth));
	}

	function scrollToSlide(index: number) {
		if (!viewport) return;
		const clamped = clampIndex(index);
		viewport.scrollTo({ left: clamped * viewport.clientWidth, behavior: 'smooth' });
	}

	onMount(() => {
		setActiveSlideFromScroll();
	});
</script>

<section class="flex h-full w-full flex-col bg-white text-black">
	<div
		bind:this={viewport}
		class="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
		on:scroll={setActiveSlideFromScroll}
	>
		{#each tileData as tile, index (tile.id)}
			<article
				class="no-scrollbar flex h-full w-full shrink-0 snap-center flex-col overflow-y-auto"
			>
				<button
					type="button"
					class="h-auto w-full shrink-0 overflow-hidden bg-neutral-900 text-left hover:cursor-pointer"
					style={`aspect-ratio: ${tile.aspectRatio ?? fallbackAspectRatio};`}
					on:click={() => goto(resolve(`/${tile.id}`))}
					aria-label={`Open ${tile.title}`}
				>
					{#if tile.stills[0]}
						<ResponsiveImage
							imageUrls={tile.stills[0].imageUrls}
							debugLabel={`${tile.title} cover still (${tile.stills[0].id})`}
							alt={tile.stills[0].alt ?? `${tile.title} cover still`}
							aspectRatio={tile.aspectRatio ?? fallbackAspectRatio}
							sizes="100vw"
							eager={index === 0}
							objectFit="contain"
						/>
					{:else}
						<div class="h-full w-full bg-neutral-900"></div>
					{/if}
				</button>

				<div class="flex flex-col items-start justify-start gap-2 bg-white px-8 py-4 text-black">
					<a
						class="flex w-full flex-row items-start justify-between gap-10 overflow-hidden"
						href={resolve(`/${tile.id}`)}
					>
						<h1 class="text-4xl">{tile.title}</h1>
						<span class=" text-3xl text-black"> {'>'} </span>
					</a>
					<p class="text-lg text-black/80">{tile.year}</p>
					<div class="w-fulloverflow-hidden mt-6 mb-4 flex">
						<p class=" text-lg text-black/80">{tile.description}</p>
					</div>
				</div>
			</article>
		{/each}
	</div>

	<div class="flex w-full items-center justify-center gap-2 px-6 py-5">
		{#each tileData as tile, index (tile.id)}
			<button
				type="button"
				on:click={() => scrollToSlide(index)}
				class="h-2.5 w-2.5 rounded-full border border-black/40 transition-all"
				class:bg-black={index === activeIndex}
				class:bg-transparent={index !== activeIndex}
				aria-label={`Go to ${tile.title}`}
			></button>
		{/each}
	</div>
</section>

<style>
	.no-scrollbar {
		scrollbar-width: none;
	}

	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
