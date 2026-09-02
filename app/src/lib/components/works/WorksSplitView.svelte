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
	const maxImageWidth = 680;

	let activeIndex = -1;

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

	$: activeWork = works[activeIndex] ?? null;
	$: previewStill = activeWork?.stills[0] ?? null;
	$: hoverDetails = activeWork
		? [activeWork.year ? String(activeWork.year) : null, activeWork.description]
				.filter((value): value is string => Boolean(value))
				.join(' / ')
		: '';
</script>

<div class="relative flex h-full w-full flex-row bg-white text-black">
	<div
		class="flex min-w-0 shrink grow basis-0 flex-col justify-center gap-1 overflow-y-auto px-8 py-8"
	>
		{#each works as work, index (work.id)}
			<button
				type="button"
				class="text-md mb-2 text-left transition-all duration-200 hover:cursor-pointer"
				class:opacity-100={index === activeIndex}
				class:opacity-40={index !== activeIndex}
				style={`font-weight: ${index === activeIndex ? activeFontWeight : 200};`}
				on:mouseenter={() => (activeIndex = index)}
				on:focus={() => (activeIndex = index)}
				on:click={() => goto(resolve(`/${work.id}`))}
			>
				{work.title}
			</button>
		{/each}
	</div>

	<button
		type="button"
		class="flex h-full min-w-0 shrink grow-2 basis-0 flex-col overflow-hidden px-8 text-left hover:cursor-pointer disabled:cursor-default"
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
		<p class="text-md pointer-events-none absolute right-8 bottom-4 text-neutral-600">
			{hoverDetails}
		</p>
	{/if}
</div>
