<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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
	$: hoverDetails = [tile.year ? String(tile.year) : null, tile.description]
		.filter((value): value is string => Boolean(value))
		.join(' / ');
</script>

<article class="group w-full bg-white">
	<div class="flex h-full w-full flex-col gap-3 overflow-hidden pb-5">
		<button
			class="grid h-full w-full grid-cols-3 overflow-hidden hover:cursor-pointer"
			style={`aspect-ratio: ${rowAspectRatio};`}
			on:click={() => goto(resolve(`/${tile.id}`))}
		>
			{#each displayedStills as still, index}
				<div class="h-full bg-neutral-800">
					{#if still}
						<ResponsiveImage
							imageUrls={still.imageUrls}
							debugLabel={`${tile.title} still ${index + 1} (${still.id})`}
							alt={still.alt ?? `${tile.title} still ${index + 1}`}
							aspectRatio={stillAspectRatio}
							sizes="(min-width: 1400px) 22vw, (min-width: 1024px) 28vw, (min-width: 768px) 40vw, 88vw"
							eager={index === 0}
						/>
					{:else}
						<div class="h-full w-full bg-neutral-800"></div>
					{/if}
				</div>
			{/each}
		</button>
		<div class="flex items-baseline gap-10 overflow-hidden">
			<h2 class="text-xl font-semibold text-black">{tile.title}</h2>
			{#if hoverDetails}
				<p
					class="text-md max-w-0 overflow-hidden whitespace-nowrap text-neutral-600 opacity-0 transition-all duration-300 ease-out group-hover:max-w-full group-hover:opacity-100"
				>
					{hoverDetails}
				</p>
			{/if}
		</div>
	</div>
</article>
