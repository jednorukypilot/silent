<script lang="ts">
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import type { WorksData } from '$lib/model/types';

	export let tile: WorksData;

	const fallbackAspectRatio = 16 / 9;
	const visibleStillCount = 3;

	$: stillAspectRatio = tile.aspectRatio ?? fallbackAspectRatio;
	$: rowAspectRatio = stillAspectRatio * visibleStillCount;
	$: displayedStills = Array.from(
		{ length: visibleStillCount },
		(_, index) => tile.stills[index] ?? null
	);
</script>

<article
	class="group relative w-full overflow-hidden rounded-3xl bg-neutral-950 text-white"
	style={`aspect-ratio: ${rowAspectRatio};`}
>
	<div class="grid h-full w-full grid-cols-3 overflow-hidden">
		{#each displayedStills as still, index}
			<div class="relative h-full min-w-0 overflow-hidden bg-neutral-900">
				{#if still}
					<ResponsiveImage
						fileKey={still.fileKey}
						alt={still.alt ?? `${tile.title} still ${index + 1}`}
						aspectRatio={stillAspectRatio}
						sizes="(min-width: 1400px) 22vw, (min-width: 1024px) 28vw, (min-width: 768px) 40vw, 88vw"
						eager={index === 0}
					/>
				{:else}
					<div class="h-full w-full bg-neutral-900"></div>
				{/if}
			</div>
		{/each}
	</div>

	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/35 to-transparent px-6 py-5"
	>
		<div class="max-w-2xl">
			<div class="flex items-end justify-between gap-4">
				<h2 class="text-2xl font-semibold tracking-tight md:text-3xl">{tile.title}</h2>
				{#if tile.year}
					<p class="text-sm text-white/75">{tile.year}</p>
				{/if}
			</div>
			{#if tile.description}
				<p class="mt-2 max-w-xl text-sm text-white/80">{tile.description}</p>
			{/if}
		</div>
	</div>
</article>
