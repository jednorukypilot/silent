<script lang="ts">
	import StillsRow from '$lib/components/StillsRow.svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';

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
	let menu: HTMLDivElement | null = null;
	let sections: (HTMLElement | null)[] = Array(titles.length).fill(null);
	let weights: number[] = Array(titles.length).fill(0);

	const bandInViewHeights = 1.6;
	const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

	function recomputeWeights() {
		if (!browser || !scroller) return;

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

	function handleMenuMouseMove(e: MouseEvent) {
		setScrollFromPointer(e.clientY);
	}

	function handleMenuEnter(e: MouseEvent) {
		setScrollFromPointer(e.clientY);
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
			{#each titles as title, i}
				<button
					type="button"
					class="mt-4 text-left text-lg transition-all"
					style="
						font-weight: {Math.round(400 + weights[i] * 500)};
						opacity: {0.35 + weights[i] * 0.65};
					"
					on:focus={() => {
						sections[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}}
				>
					{title}
				</button>
			{/each}
		</div>
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
