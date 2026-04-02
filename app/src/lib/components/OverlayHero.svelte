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
	const TOUCH_DRAG_SPEED = 0.0015;
	const AUTO_DURATION = 700;
	const AUTO_TRIGGER_THRESHOLD = 0.33;

	let isTouchDragging = $state(false);
	let lastTouchY = $state(0);
	let suppressNextClick = $state(false);

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

	function applyProgressDelta(deltaY: number, speed: number) {
		progress = clamp(progress + deltaY * speed, 0, HERO_TRAVEL);

		if (progress >= AUTO_TRIGGER_THRESHOLD) {
			animateToEnd();
			return;
		}

		if (progress >= HERO_TRAVEL) {
			finishIntro();
		}
	}

	function handleWheel(e: WheelEvent) {
		if (introDone || isAnimating) return;

		e.preventDefault();

		// only react to scrolling down
		// if (e.deltaY <= 0) return;

		applyProgressDelta(e.deltaY, SCROLL_SPEED);
	}

	function handleTouchStart(e: TouchEvent) {
		if (introDone || isAnimating || e.touches.length === 0) return;

		isTouchDragging = true;
		lastTouchY = e.touches[0].clientY;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isTouchDragging || introDone || isAnimating || e.touches.length === 0) return;

		e.preventDefault();

		const currentY = e.touches[0].clientY;
		const deltaY = lastTouchY - currentY;

		if (Math.abs(deltaY) > 1) {
			suppressNextClick = true;
		}

		lastTouchY = currentY;

		applyProgressDelta(deltaY, TOUCH_DRAG_SPEED);
	}

	function handleTouchEnd() {
		isTouchDragging = false;
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
		class="fixed inset-0 z-50 cursor-pointer touch-none bg-black will-change-transform"
		style={heroStyle}
		onclick={() => {
			if (suppressNextClick) {
				suppressNextClick = false;
				return;
			}

			animateToEnd();
		}}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		ontouchcancel={handleTouchEnd}
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
