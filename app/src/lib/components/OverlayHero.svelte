<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		onIntroDone?: () => void;
	};

	let { onIntroDone = () => {} }: Props = $props();

	let introDone = $state(false);
	let isAnimating = $state(false);
	let progress = $state(0);

	const HERO_TRAVEL = 1;
	const SCROLL_SPEED = 0.0015;
	const AUTO_DURATION = 700;
	const AUTO_TRIGGER_THRESHOLD = 0.33;

	function clamp(v: number, min: number, max: number) {
		return Math.min(max, Math.max(min, v));
	}

	function easeOutCubic(t: number) {
		return 1 - Math.pow(1 - t, 3);
	}

	function finishIntro() {
		if (introDone) return;

		progress = HERO_TRAVEL;
		introDone = true;
		isAnimating = false;
		onIntroDone();
	}

	function animateToEnd() {
		if (introDone || isAnimating) return;

		isAnimating = true;

		const startProgress = progress;
		const remaining = HERO_TRAVEL - startProgress;
		const startTime = performance.now();

		function frame(now: number) {
			const elapsed = now - startTime;
			const t = clamp(elapsed / AUTO_DURATION, 0, 1);
			const eased = easeOutCubic(t);

			progress = startProgress + remaining * eased;

			if (t < 1) {
				requestAnimationFrame(frame);
			} else {
				finishIntro();
			}
		}

		requestAnimationFrame(frame);
	}

	function handleWheel(e: WheelEvent) {
		if (introDone || isAnimating) return;

		e.preventDefault();

		// only react to scrolling down
		// if (e.deltaY <= 0) return;

		progress = clamp(progress + e.deltaY * SCROLL_SPEED, 0, HERO_TRAVEL);

		if (progress >= AUTO_TRIGGER_THRESHOLD) {
			animateToEnd();
			return;
		}

		if (progress >= HERO_TRAVEL) {
			finishIntro();
		}
	}

	onMount(() => {
		window.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			window.removeEventListener('wheel', handleWheel);
		};
	});

	const heroStyle = $derived(`transform: translateY(-${progress * 100}vh);`);
</script>

{#if !introDone}
	<div
		class="fixed inset-0 z-50 cursor-pointer bg-black will-change-transform"
		style={heroStyle}
		onclick={animateToEnd}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				animateToEnd();
			}
		}}
	>
		<div class="flex h-[calc(100vh-4rem)] items-center justify-center">
			<div class="flex h-56 w-56 items-center justify-center bg-white text-7xl text-black">kt</div>
		</div>
	</div>
{/if}
