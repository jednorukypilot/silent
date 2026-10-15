<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import { resolveBackdrop } from '$lib/backdrop';
	import type { Still } from '$lib/model/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// PLACEHOLDERS — swap for the real address and handles.
	const NAME = 'Kryštof Tichý';
	const ROLE = 'Cinematographer';
	const EMAIL = 'hello@example.com';
	const INSTAGRAM = 'https://www.instagram.com/';
	const VIMEO = 'https://vimeo.com/';

	// Null until mount under the 'visit' strategy, already set under 'build'.
	// See $lib/backdrop.ts to switch this page between the two.
	let still = $state<Still | null>(data.contact.chosen);

	// The chrome around the frame only reads as a monitor while the timecode runs,
	// so it ticks off the wall clock (25 fps) instead of counting its own frames.
	let elapsedMs = $state(0);

	onMount(() => {
		still = resolveBackdrop(data.contact);

		const startedAt = performance.now();
		const tick = window.setInterval(() => {
			elapsedMs = performance.now() - startedAt;
		}, 40);

		return () => window.clearInterval(tick);
	});

	const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

	const timecode = $derived.by(() => {
		const s = elapsedMs / 1000;
		return `${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}:${pad((s * 25) % 25)}`;
	});
</script>

{#snippet gate(size: string)}
	<!-- The logo frame: the top-left icon blown up, left hollow so the still runs
	     through it the way a framing guide sits over a live feed. -->
	<div class={`relative flex items-center justify-center border-2 border-white ${size}`}>
		<img src={asset('/logo.svg')} alt="Logo" class="h-2/5 w-2/5 object-contain invert" />

		<span class="absolute top-0 left-1/2 h-3 w-px -translate-x-1/2 bg-white"></span>
		<span class="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-white"></span>
		<span class="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 bg-white"></span>
		<span class="absolute top-1/2 right-0 h-px w-3 -translate-y-1/2 bg-white"></span>
	</div>
{/snippet}

{#snippet identity(align: string)}
	<div class={`flex flex-col gap-1 ${align}`}>
		<p class="text-xl tracking-[0.15em] text-white">{NAME}</p>
		<p class="font-mono text-[0.65rem] tracking-[0.3em] text-white/60 uppercase">{ROLE}</p>
	</div>
{/snippet}

{#snippet mail(align: string)}
	<a
		href={`mailto:${EMAIL}`}
		class={`pointer-events-auto text-sm tracking-[0.2em] text-white underline-offset-8 hover:underline ${align}`}
	>
		{EMAIL}
	</a>
{/snippet}

{#snippet socials(align: string)}
	<div class={`pointer-events-auto flex gap-3 ${align}`}>
		<a
			href={INSTAGRAM}
			target="_blank"
			rel="noreferrer"
			class="flex h-10 items-center gap-2 border border-white/70 px-3 text-white transition-colors hover:bg-white hover:text-black"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<rect
					x="3.5"
					y="3.5"
					width="17"
					height="17"
					rx="5"
					stroke="currentColor"
					stroke-width="1.5"
				/>
				<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5" />
				<circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
			</svg>
			<span class="font-mono text-[0.6rem] tracking-[0.25em] uppercase">Instagram</span>
		</a>

		<a
			href={VIMEO}
			target="_blank"
			rel="noreferrer"
			class="flex h-10 items-center gap-2 border border-white/70 px-3 text-white transition-colors hover:bg-white hover:text-black"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<rect x="3.5" y="3.5" width="17" height="17" stroke="currentColor" stroke-width="1.5" />
				<path d="M10 8.5L15.5 12L10 15.5Z" fill="currentColor" />
			</svg>
			<span class="font-mono text-[0.6rem] tracking-[0.25em] uppercase">Vimeo</span>
		</a>
	</div>
{/snippet}

<div class="absolute top-16 right-0 bottom-0 left-0 overflow-hidden bg-black">
	{#if still}
		<ResponsiveImage
			fileKey={still.fileKey}
			lqip={still.lqip}
			debugLabel={`contact backdrop (${still.id})`}
			alt={still.alt ?? ''}
			aspectRatio={still.aspectRatio ?? 16 / 9}
			sizes="100vw"
			eager
			background="#000000"
		/>
	{/if}

	<div class="pointer-events-none absolute inset-0 bg-black/45"></div>

	<!-- Screen chrome: what the monitor draws over the feed, not the contact details. -->
	<div class="pointer-events-none absolute inset-0">
		<span class="absolute top-4 left-4 h-7 w-7 border-t-2 border-l-2 border-white/70"></span>
		<span class="absolute top-4 right-4 h-7 w-7 border-t-2 border-r-2 border-white/70"></span>
		<span class="absolute bottom-4 left-4 h-7 w-7 border-b-2 border-l-2 border-white/70"></span>
		<span class="absolute right-4 bottom-4 h-7 w-7 border-r-2 border-b-2 border-white/70"></span>

		<div class="absolute inset-0 hidden md:block">
			<span class="absolute top-0 bottom-0 left-1/3 w-px bg-white/10"></span>
			<span class="absolute top-0 right-1/3 bottom-0 w-px bg-white/10"></span>
			<span class="absolute top-1/3 right-0 left-0 h-px bg-white/10"></span>
			<span class="absolute right-0 bottom-1/3 left-0 h-px bg-white/10"></span>
		</div>

		<div
			class="absolute top-5 left-14 flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.3em] text-white/70 uppercase"
		>
			<span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
			Rec
		</div>

		<div
			class="absolute top-5 right-14 font-mono text-[0.65rem] tracking-[0.3em] text-white/70 tabular-nums"
		>
			{timecode}
		</div>

		<div
			class="absolute bottom-5 left-14 font-mono text-[0.65rem] tracking-[0.3em] text-white/50 uppercase"
		>
			4K · 25 fps
		</div>

		<div
			class="absolute right-14 bottom-5 flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.3em] text-white/50"
		>
			<span>100%</span>
			<svg class="h-3 w-6" viewBox="0 0 24 12" fill="none" aria-hidden="true">
				<rect x="0.75" y="0.75" width="19" height="10.5" stroke="currentColor" />
				<rect x="2.5" y="2.5" width="15.5" height="7" fill="currentColor" />
				<rect x="21" y="4" width="2.5" height="4" fill="currentColor" />
			</svg>
		</div>
	</div>

	<!-- Desktop: the details ring the frame — name above, mail below, keys down the side. -->
	<div class="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
		<div class="relative h-64 w-64 lg:h-80 lg:w-80">
			{@render gate('h-full w-full')}

			<div class="absolute bottom-full left-0 mb-6 whitespace-nowrap">
				{@render identity('items-start text-left')}
			</div>

			<div class="absolute top-full left-0 mt-6 whitespace-nowrap">
				{@render mail('')}
			</div>

			<!-- Stacked down the side rather than along the bottom: two buttons in a row
			     reach past the viewport edge once the frame is centred at 768px. -->
			<div class="absolute top-0 left-full ml-8">
				{@render socials('flex-col items-start')}
			</div>
		</div>
	</div>

	<!-- Phone: same parts, stacked, with the screen chrome still on the edges. -->
	<div class="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 md:hidden">
		{@render identity('items-center text-center')}
		{@render gate('h-48 w-48')}
		<div class="flex flex-col items-center gap-5">
			{@render mail('text-center')}
			{@render socials('justify-center')}
		</div>
	</div>
</div>
