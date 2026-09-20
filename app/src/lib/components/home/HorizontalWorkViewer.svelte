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

	// Native touch panning already gives mobile the swipe gesture; mouse users get no
	// equivalent (dragging with a mouse doesn't scroll a container by default), so drag
	// support here is implemented manually and only engaged for mouse pointers.
	let isPointerDown = false;
	let isDragging = false;
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

<section class="flex h-full w-full flex-col bg-white text-black">
	<div
		bind:this={viewport}
		class="no-scrollbar flex min-h-0 flex-1 cursor-grab snap-x overflow-x-auto overflow-y-hidden select-none"
		class:cursor-grabbing={isDragging}
		class:snap-mandatory={!isDragging}
		on:scroll={setActiveSlideFromScroll}
		on:pointerdown={handlePointerDown}
		on:pointermove={handlePointerMove}
		on:pointerup={endDrag}
		on:pointercancel={endDrag}
	>
		{#each tileData as tile, index (tile.id)}
			<article
				class="no-scrollbar flex h-full w-full shrink-0 snap-center flex-col overflow-y-auto"
			>
				<button
					type="button"
					class="h-auto w-full shrink-0 overflow-hidden bg-neutral-900 text-left hover:cursor-pointer"
					style={`aspect-ratio: ${tile.aspectRatio ?? fallbackAspectRatio};`}
					on:click={() => {
						if (dragMoved) return;
						goto(resolve(`/${tile.id}`));
					}}
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
						on:click={(event) => {
							if (dragMoved) event.preventDefault();
						}}
					>
						<h1 class="text-4xl">{tile.title}</h1>
						<span class=" text-3xl text-black"> {'>'} </span>
					</a>
					<p class="text-lg text-black/80">{tile.year}</p>
					<div class="mt-6 mb-4 flex w-full overflow-hidden">
						<p class=" text-lg text-black/80">{tile.description}</p>
					</div>
				</div>
			</article>
		{/each}
	</div>

	<div class="flex w-full items-center justify-center gap-1.5 px-6 py-5">
		{#each tileData as tile, index (tile.id)}
			<button
				type="button"
				on:click={() => scrollToSlide(index)}
				class="flex h-5 w-3 items-center justify-center"
				aria-label={`Go to ${tile.title}`}
			>
				<svg
					class={`h-full w-full transition-colors ${index === activeIndex ? 'text-black' : 'text-black/30'}`}
					viewBox="0 0 12 20"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M9 3L3 17"
						stroke="currentColor"
						stroke-width={index === activeIndex ? '2.5' : '1.5'}
						class="transition-all"
					/>
				</svg>
			</button>
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

	.no-scrollbar :global(img) {
		-webkit-user-drag: none;
		user-select: none;
	}
</style>
