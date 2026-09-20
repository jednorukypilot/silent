<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import type { WorksData } from '$lib/model/types';

	export let works: WorksData[] = [];

	const fallbackAspectRatio = 16 / 9;
	const animationDuration = 50;
	const activeFontWeight = 390;
	const inactiveFontWeight = 100;
	const maxImageWidth = 680;

	let activeIndex = -1;

	// Native scrollbar is hidden on the list (see markup) and replaced with drag-to-scroll,
	// so the scrollbar's job of showing "there's more to scroll" is instead done by an
	// edge mask that fades items out near the top/bottom of the list.
	let listContainer: HTMLDivElement | null = null;
	let isPointerDown = false;
	let isDragging = false;
	let dragMoved = false;
	let dragPointerId = -1;
	let dragStartY = 0;
	let dragStartScrollTop = 0;
	const dragThreshold = 4;
	const edgeTolerancePx = 1;

	// Which end(s) of the list currently have more content to scroll to. The fade at an
	// edge is dropped once there's nothing left in that direction, so it only ever reads
	// as "scroll here" rather than always framing the list regardless of position.
	let canScrollUp = false;
	let canScrollDown = false;

	function updateScrollEdges() {
		if (!listContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = listContainer;
		canScrollUp = scrollTop > edgeTolerancePx;
		canScrollDown = scrollTop + clientHeight < scrollHeight - edgeTolerancePx;
	}

	$: listMaskImage = `linear-gradient(to bottom, ${canScrollUp ? 'transparent 0%, black 35%' : 'black 0%'}, ${canScrollDown ? 'black 65%, transparent 100%' : 'black 100%'})`;

	// Pointer capture is only claimed once real drag movement is detected, not on every
	// press: capturing eagerly retargets the browser's synthesized click event to this
	// container instead of the pressed item, silently breaking click-to-navigate.
	function handlePointerDown(event: PointerEvent) {
		if (!listContainer || (event.pointerType === 'mouse' && event.button !== 0)) return;
		isPointerDown = true;
		dragMoved = false;
		dragPointerId = event.pointerId;
		dragStartY = event.clientY;
		dragStartScrollTop = listContainer.scrollTop;
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isPointerDown || !listContainer) return;
		const delta = event.clientY - dragStartY;

		if (!isDragging) {
			if (Math.abs(delta) <= dragThreshold) return;
			isDragging = true;
			dragMoved = true;
			listContainer.setPointerCapture(dragPointerId);
		}

		listContainer.scrollTop = dragStartScrollTop - delta;
		updateScrollEdges();
	}

	function endDrag() {
		isPointerDown = false;
		if (isDragging) listContainer?.releasePointerCapture(dragPointerId);
		isDragging = false;
	}

	function handleItemClick(workId: string) {
		if (dragMoved) return;
		goto(resolve(`/${workId}`));
	}

	// Warm the browser cache with just the small preview for every work, so hovering
	// always has *something* to show immediately. The full-size image for the actually
	// displayed still is fetched normally (via its own srcset) the moment it's hovered.
	onMount(() => {
		for (const work of works) {
			const still = work.stills[0];
			if (!still?.imageUrls?.w480) continue;
			const preload = new Image();
			preload.src = still.imageUrls.w480;
		}
	});

	onMount(() => {
		updateScrollEdges();
		window.addEventListener('resize', updateScrollEdges);
		return () => window.removeEventListener('resize', updateScrollEdges);
	});

	$: activeWork = works[activeIndex] ?? null;
	$: previewStill = activeWork?.stills[0] ?? null;
	$: hoverDetails = activeWork
		? [activeWork.year ? String(activeWork.year) : null, activeWork.description]
				.filter((value): value is string => Boolean(value))
				.join(' / ')
		: '';
</script>

<div class="relative flex h-full w-full flex-row bg-white">
	<div
		bind:this={listContainer}
		class="flex min-w-0 shrink grow basis-0 cursor-grab flex-col justify-center-safe overflow-y-auto px-8 py-2 select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		class:cursor-grabbing={isDragging}
		style={`mask-image: ${listMaskImage}; -webkit-mask-image: ${listMaskImage};`}
		on:pointerdown={handlePointerDown}
		on:pointermove={handlePointerMove}
		on:pointerup={endDrag}
		on:pointercancel={endDrag}
		on:scroll={updateScrollEdges}
	>
		{#each works as work, index (work.id)}
			<button
				type="button"
				class="text-md mt-2.5 text-left transition-all hover:cursor-pointer"
				style={`font-weight: ${index === activeIndex ? activeFontWeight : inactiveFontWeight};`}
				on:mouseenter={() => (activeIndex = index)}
				on:focus={() => (activeIndex = index)}
				on:click={() => handleItemClick(work.id)}
			>
				{work.title}
			</button>
		{/each}
	</div>

	<button
		type="button"
		class="flex h-full min-w-0 shrink grow-2 basis-0 flex-col overflow-hidden px-8 text-left hover:cursor-pointer disabled:cursor-default lg:pr-16 xl:pr-32 2xl:pr-48"
		disabled={!activeWork}
		on:click={() => activeWork && goto(resolve(`/${activeWork.id}`))}
	>
		<div
			class="relative mx-auto min-h-0 w-full flex-1 bg-white"
			style={`max-width: ${maxImageWidth}px;`}
		>
			{#if previewStill}
				{#key activeWork?.id}
					<div class="absolute inset-0" transition:fade={{ duration: animationDuration }}>
						<ResponsiveImage
							imageUrls={previewStill.imageUrls}
							debugLabel={`${activeWork?.title} preview still (${previewStill.id})`}
							alt={previewStill.alt ?? `${activeWork?.title} preview`}
							aspectRatio={activeWork?.aspectRatio ?? fallbackAspectRatio}
							sizes="66vw"
							objectFit="contain"
							objectPosition="center"
							background="transparent"
						/>
					</div>
				{/key}
			{/if}
		</div>
	</button>

	{#if hoverDetails}
		<p class="text-md pointer-events-none absolute right-8 bottom-4 bg-white text-neutral-600">
			{hoverDetails}
		</p>
	{/if}
</div>
