<script lang="ts">
	import StillsRow from '$lib/components/StillsRow.svelte';
	import { onMount, onDestroy, tick } from 'svelte';

	const titles = [
		'First',
		'Second',
		'Third',
		'Fourth',
		'Fifth',
		'Sixth',
		'Seventh',
		'Eighth',
		'Ninth'
	];

	let scroller: HTMLDivElement | null = null;
	let sections: (HTMLElement | null)[] = Array(titles.length).fill(null);

	let weights: number[] = Array(titles.length).fill(0);

	const bandInViewHeights = 1.6;

	const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

	function recomputeWeights() {
		if (!scroller || typeof window === 'undefined') return;

		const rootRect = scroller.getBoundingClientRect();
		const centerY = rootRect.top + rootRect.height / 2;
		const radius = (rootRect.height * bandInViewHeights) / 2;

		const next = new Array(sections.length).fill(0);

		for (let i = 0; i < sections.length; i++) {
			const el = sections[i];
			if (!el) continue;

			const r = el.getBoundingClientRect();
			const elCenter = (r.top + r.bottom) / 2;

			const d = Math.abs(elCenter - centerY);
			const t = 1 - clamp01(d / radius);
			next[i] = t * t;
		}

		weights = next;
	}

	let raf = 0;
	function onScroll() {
		if (typeof cancelAnimationFrame !== 'undefined') {
			cancelAnimationFrame(raf);
		}
		if (typeof requestAnimationFrame !== 'undefined') {
			raf = requestAnimationFrame(recomputeWeights);
		}
	}

	onMount(async () => {
		await tick();
		recomputeWeights();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', recomputeWeights);
		}
	});

	onDestroy(() => {
		if (typeof cancelAnimationFrame !== 'undefined') {
			cancelAnimationFrame(raf);
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', recomputeWeights);
		}
	});
</script>

<div class="flex h-screen w-full flex-row">
	<div class="flex w-1/3 flex-col items-start justify-center p-8">
		{#each titles as title, i}
			<button
				type="button"
				class="mt-4 text-left text-lg transition-all"
				style="
					font-weight: {Math.round(400 + weights[i] * 500)};
					opacity: {0.35 + weights[i] * 0.65};
				"
				on:mouseover={() => {
					sections[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}}
				on:focus={() => {
					sections[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}}
			>
				{title}
			</button>
		{/each}
	</div>

	<div
		bind:this={scroller}
		on:scroll={onScroll}
		class="flex w-full flex-col gap-4 overflow-y-scroll py-4"
	>
		{#each titles as title, i}
			<section bind:this={sections[i]}>
				<StillsRow {title} />
			</section>
		{/each}
	</div>
</div>
