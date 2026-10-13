<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import type { WorksData } from '$lib/model/types';
	import { onMount } from 'svelte';

	let { tileData = [] }: { tileData: WorksData[] } = $props();

	const fallbackAspectRatio = 16 / 9;

	let viewport: HTMLDivElement | null = null;
	let slides: (HTMLElement | null)[] = $state([]);
	let activeIndex = $state(0);

	// 0 while the cover image still owns the screen, 1 once the info card has been
	// pulled all the way up over it. Drives the slide indicator out of the way, since
	// it is white-on-image and would be invisible over the white card.
	let infoProgress = $state(0);

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

	function updateInfoProgress() {
		const slide = slides[activeIndex];
		if (!slide) return;

		// The indicator is fully gone well before the card is, so it never lands on white.
		const travel = slide.clientHeight * 0.4;
		infoProgress = travel === 0 ? 0 : Math.min(1, slide.scrollTop / travel);
	}

	function setActiveSlideFromScroll() {
		if (!viewport || tileData.length === 0) return;
		const slideWidth = viewport.clientWidth;
		if (slideWidth === 0) return;

		activeIndex = clampIndex(Math.round(viewport.scrollLeft / slideWidth));
		// Each slide keeps its own vertical offset, so the indicator has to be re-read
		// from whichever slide just became the active one.
		updateInfoProgress();
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
			<!-- Each slide is its own vertical scroller: the cover fills the screen and the
			     info card sits just past the fold, pulled up by swiping. -->
			<article
				bind:this={slides[index]}
				class="no-scrollbar h-full w-full shrink-0 snap-center overflow-y-auto overscroll-y-none bg-black"
				onscroll={() => {
					if (index === activeIndex) updateInfoProgress();
				}}
			>
				<!-- The cover is sized by this div rather than by the button around it:
				     percentage heights inside a <button> don't resolve reliably, so the
				     click target is laid over the image instead of wrapping it. -->
				<div class="relative h-full w-full overflow-hidden bg-black">
					{#if tile.stills[0]}
						<ResponsiveImage
							fileKey={tile.stills[0].fileKey}
							lqip={tile.stills[0].lqip}
							debugLabel={`${tile.title} cover still (${tile.stills[0].id})`}
							alt={tile.stills[0].alt ?? `${tile.title} cover still`}
							aspectRatio={tile.aspectRatio ?? fallbackAspectRatio}
							sizes="100vw"
							eager={index === 0}
							objectFit="cover"
							background="#000000"
						/>
					{:else}
						<div class="h-full w-full bg-black"></div>
					{/if}
					<button
						type="button"
						class="absolute inset-0 hover:cursor-pointer"
						onclick={() => {
							if (dragMoved) return;
							goto(resolve(`/${tile.id}`));
						}}
						aria-label={`Open ${tile.title}`}
					></button>
				</div>

				<div
					class="flex flex-col items-start justify-start gap-2 bg-white px-8 pt-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-black"
				>
					<a
						class="flex w-full flex-row items-start justify-between gap-10 overflow-hidden"
						href={resolve(`/${tile.id}`)}
						onclick={(event) => {
							if (dragMoved) event.preventDefault();
						}}
					>
						<h1 class="text-4xl">{tile.title}</h1>
						<span class=" text-3xl text-black"> {'>'} </span>
					</a>
					<p class="text-lg text-black/80">{tile.year}</p>
					<div class="mt-6 flex w-full overflow-hidden">
						<p class=" text-lg text-black/80">{tile.description}</p>
					</div>
				</div>
			</article>
		{/each}
	</div>

	<div
		class="pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex items-end justify-center pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
		class:invisible={infoProgress >= 1}
		style={`opacity: ${1 - infoProgress};`}
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
</style>
