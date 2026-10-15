<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import type { WorksData } from '$lib/model/types';
	import { onMount } from 'svelte';

	let { tileData = [] }: { tileData: WorksData[] } = $props();

	const fallbackAspectRatio = 16 / 9;

	let viewport: HTMLDivElement | null = null;
	let activeIndex = $state(0);

	// Native touch panning already gives mobile the swipe gesture; mouse users get no
	// equivalent (dragging with a mouse doesn't scroll a container by default), so drag
	// support here is implemented manually and only engaged for mouse pointers.
	let isPointerDown = false;
	let isDragging = $state(false);
	let dragMoved = false;
	let dragPointerId = -1;
	let dragStartX = 0;
	let dragStartScrollLeft = 0;
	const dragThreshold = 4;

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

	function handlePointerDown(event: PointerEvent) {
		if (!viewport || event.pointerType !== 'mouse' || event.button !== 0) return;
		isPointerDown = true;
		dragMoved = false;
		dragPointerId = event.pointerId;
		dragStartX = event.clientX;
		dragStartScrollLeft = viewport.scrollLeft;
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isPointerDown || !viewport) return;
		const delta = event.clientX - dragStartX;

		if (!isDragging) {
			if (Math.abs(delta) <= dragThreshold) return;
			isDragging = true;
			dragMoved = true;
			viewport.setPointerCapture(dragPointerId);
		}

		viewport.scrollLeft = dragStartScrollLeft - delta;
		setActiveSlideFromScroll();
	}

	function endDrag() {
		isPointerDown = false;
		if (isDragging) {
			viewport?.releasePointerCapture(dragPointerId);
			scrollToSlide(activeIndex);
		}
		isDragging = false;
	}

	onMount(() => {
		setActiveSlideFromScroll();
	});
</script>

<section class="relative flex h-full w-full flex-col bg-black text-white">
	<div
		bind:this={viewport}
		class="no-scrollbar flex min-h-0 flex-1 cursor-grab snap-x overflow-x-auto overflow-y-hidden select-none"
		class:cursor-grabbing={isDragging}
		class:snap-mandatory={!isDragging}
		onscroll={setActiveSlideFromScroll}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={endDrag}
		onpointercancel={endDrag}
	>
		{#each tileData as tile, index (tile.id)}
			<article class="relative h-full w-full shrink-0 snap-center overflow-hidden bg-black">
				{#if tile.cover}
					<ResponsiveImage
						fileKey={tile.cover.fileKey}
						lqip={tile.cover.lqip}
						debugLabel={`${tile.title} cover still (${tile.cover.id})`}
						alt={tile.cover.alt ?? `${tile.title} cover still`}
						aspectRatio={tile.aspectRatio ?? fallbackAspectRatio}
						sizes="100vw"
						eager={index === 0}
						objectFit="cover"
						background="#000000"
					/>
				{:else}
					<div class="h-full w-full bg-black"></div>
				{/if}

				<!-- The whole still is the link; the label just rides on top of it. -->
				<button
					type="button"
					class="absolute inset-0 hover:cursor-pointer"
					onclick={() => {
						if (dragMoved) return;
						goto(resolve(`/${tile.id}`));
					}}
					aria-label={`Open ${tile.title}`}
				></button>

				<!-- Each line is its own block, so a long credit wraps against the left
				     margin instead of hanging off the end of the year. -->
				<div
					class="overlay-label pointer-events-none absolute inset-x-0 top-0 px-6 pt-7 font-serif leading-tight text-white"
				>
					<h2 class="text-lg">{tile.title}</h2>
					{#if tile.year}
						<p class="text-lg">{tile.year}</p>
					{/if}
					{#if tile.description}
						<p class="mt-1.5 text-base text-white/90">{tile.description}</p>
					{/if}
				</div>
			</article>
		{/each}
	</div>

	<div
		class="pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex items-end justify-center pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
	>
		<div class="flex items-center gap-2.5 px-6">
			{#each tileData as tile, index (tile.id)}
				<!-- The dot is 8px but the button is sized for a thumb. -->
				<button
					type="button"
					onclick={() => scrollToSlide(index)}
					class="pointer-events-auto flex h-6 w-6 items-center justify-center"
					aria-label={`Go to ${tile.title}`}
				>
					<span
						class={`h-2 w-2 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.65)] transition-colors ${index === activeIndex ? 'bg-white' : 'bg-white/40'}`}
					></span>
				</button>
			{/each}
		</div>
	</div>
</section>

<style>
	.no-scrollbar {
		scrollbar-width: none;
	}

	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	.no-scrollbar :global(img) {
		-webkit-user-drag: none;
		user-select: none;
	}

	/* White on an unknown frame: a still with a blown-out corner would swallow the
	   label, and a scrim would fight the full-bleed image. The shadow is invisible on
	   dark stills and just holds the edges on bright ones. */
	.overlay-label {
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
	}
</style>
