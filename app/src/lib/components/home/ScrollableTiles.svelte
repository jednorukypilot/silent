<script lang="ts">
	import { browser } from '$app/environment';
	import type { WorksData } from '$lib/model/types';
	import { onDestroy, onMount, tick } from 'svelte';
	import StillsRow from './StillsRow.svelte';

	export let tileData: WorksData[] = [];

	let scroller: HTMLDivElement | null = null;
	let menu: HTMLDivElement | null = null;
	let sections: (HTMLElement | null)[] = [];
	let weights: number[] = [];

	const bandInViewHeights = 1.6;
	const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

	$: sections = Array(tileData.length).fill(null);
	$: weights = Array(tileData.length).fill(0);

	function recomputeWeights() {
		if (!browser || !scroller) return;

		const rootRect = scroller.getBoundingClientRect();
		const centerY = rootRect.top + rootRect.height / 2;
		const radius = (rootRect.height * bandInViewHeights) / 2;

		const next = new Array(sections.length).fill(0);

		for (let i = 0; i < sections.length; i++) {
			const element = sections[i];
			if (!element) continue;

			const rect = element.getBoundingClientRect();
			const elementCenter = (rect.top + rect.bottom) / 2;
			const distance = Math.abs(elementCenter - centerY);
			const weight = 1 - clamp01(distance / radius);

			next[i] = weight * weight;
		}

		weights = next;
	}

	let raf = 0;

	function onScroll() {
		if (!browser) return;

		window.cancelAnimationFrame(raf);
		raf = window.requestAnimationFrame(recomputeWeights);
	}

	function setScrollFromPointer(clientY: number) {
		if (!browser || !menu || !scroller) return;

		const rect = menu.getBoundingClientRect();
		const ratio = clamp01((clientY - rect.top) / rect.height);
		const maxScroll = scroller.scrollHeight - scroller.clientHeight;

		scroller.scrollTop = ratio * maxScroll;
	}

	function handleMenuMouseMove(event: MouseEvent) {
		setScrollFromPointer(event.clientY);
	}

	function handleMenuEnter(event: MouseEvent) {
		setScrollFromPointer(event.clientY);
	}

	onMount(async () => {
		await tick();
		recomputeWeights();
		window.addEventListener('resize', recomputeWeights);
	});

	onDestroy(() => {
		if (!browser) return;

		window.cancelAnimationFrame(raf);
		window.removeEventListener('resize', recomputeWeights);
	});
</script>

<div class="flex h-full w-full flex-row">
	<div class="flex w-1/3 items-center bg-blue-50">
		<div
			class="flex w-2/3 flex-col justify-center bg-gray-50 px-8 py-2"
			bind:this={menu}
			role="region"
			on:mouseenter={handleMenuEnter}
			on:mousemove={handleMenuMouseMove}
		>
			{#each tileData as tile, index (tile.id)}
				<button
					type="button"
					class="mt-4 text-left text-lg transition-all"
					style="
						font-weight: {Math.round(400 + weights[index] * 500)};
						opacity: {0.35 + weights[index] * 0.65};
					"
					on:focus={() => {
						sections[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}}
				>
					{tile.title}
				</button>
			{/each}
		</div>
	</div>

	<div
		bind:this={scroller}
		on:scroll={onScroll}
		class="flex w-full flex-col gap-4 overflow-y-scroll py-4"
	>
		{#each tileData as tile, index (tile.id)}
			<section bind:this={sections[index]}>
				<StillsRow {tile} />
			</section>
		{/each}
	</div>
</div>
