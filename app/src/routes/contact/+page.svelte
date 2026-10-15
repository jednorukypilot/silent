<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import { resolveBackdrop } from '$lib/backdrop';
	import { listedWorks } from '$lib/works';
	import type { Still } from '$lib/model/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// PLACEHOLDERS — swap for the real address and handles.
	const NAME = 'Kryštof Tichý';
	const ROLE = 'Cinematographer';
	const EMAIL = 'hello@example.com';
	const INSTAGRAM = { handle: '@krystoftichy', href: 'https://www.instagram.com/' };
	const VIMEO = { handle: '/krystoftichy', href: 'https://vimeo.com/' };

	// Null until mount under the 'visit' strategy, already set under 'build'.
	// See $lib/backdrop.ts to switch this page between the two.
	let still = $state<Still | null>(data.contact.chosen);

	// The panel only reads as a camera monitor while the timecode runs, so it ticks
	// off the wall clock at 25 fps rather than counting its own frames.
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

{#snippet readout(label: string, value: string)}
	<div class="flex items-baseline gap-3">
		<span class="w-16 shrink-0 font-mono text-[0.6rem] tracking-[0.25em] text-white/50 uppercase">
			{label}
		</span>
		<span class="font-mono text-xs tracking-[0.15em] text-white/90">{value}</span>
	</div>
{/snippet}

<div class="absolute top-16 right-0 bottom-0 left-0 overflow-hidden bg-black">
	<div class="absolute inset-0">
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
		<div class="absolute inset-0 bg-black/30"></div>
	</div>

	<!-- The monitor's own UI: tiled cells, label over value, hairline black gutters.
	     The cells are translucent so the still still reads as the feed underneath. -->
	<div class="absolute inset-0 overflow-y-auto overscroll-y-none">
		<div class="flex min-h-full items-center justify-center p-3 md:p-6">
			<div class="flex w-full max-w-4xl flex-col gap-px">
				<div class="grid grid-cols-2 gap-px md:grid-cols-4">
					<div class="col-span-2 bg-white/15 px-4 py-3 backdrop-blur-md md:px-5 md:py-4">
						<p class="font-mono text-[0.6rem] tracking-[0.3em] text-white/55 uppercase">Name</p>
						<p class="mt-1 text-2xl text-white md:text-3xl">{NAME}</p>
					</div>
					<div class="bg-white/15 px-4 py-3 backdrop-blur-md md:px-5 md:py-4">
						<p class="font-mono text-[0.6rem] tracking-[0.3em] text-white/55 uppercase">Role</p>
						<p class="mt-1 text-base text-white md:text-xl">{ROLE}</p>
					</div>
					<div class="bg-white/15 px-4 py-3 backdrop-blur-md md:px-5 md:py-4">
						<div class="flex items-baseline justify-between gap-2">
							<p class="font-mono text-[0.6rem] tracking-[0.3em] text-white/55 uppercase">TC</p>
							<p class="font-mono text-[0.6rem] tracking-[0.2em] text-white/55">@25</p>
						</div>
						<p class="mt-1 font-mono text-base tracking-[0.1em] text-white tabular-nums md:text-xl">
							{timecode}
						</p>
					</div>
				</div>

				<div
					class="flex flex-col items-center justify-between gap-6 bg-white/15 px-5 py-6 backdrop-blur-md md:flex-row md:gap-6 md:px-8 md:py-7"
				>
					<div class="flex items-center gap-3 md:w-48">
						<span class="h-5 w-5 rounded-full bg-green-500"></span>
						<div>
							<p class="text-lg tracking-[0.1em] text-white uppercase">Available</p>
							<p class="font-mono text-[0.6rem] tracking-[0.25em] text-white/55 uppercase">
								For commissions
							</p>
						</div>
					</div>

					<!-- The top-left icon blown up: hollow, so the feed runs through it. -->
					<div
						class="relative flex h-40 w-40 shrink-0 items-center justify-center border-2 border-white md:h-52 md:w-52"
					>
						<img src={asset('/logo.svg')} alt="Logo" class="h-2/5 w-2/5 object-contain invert" />
						<span class="absolute top-0 left-1/2 h-3 w-px -translate-x-1/2 bg-white"></span>
						<span class="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-white"></span>
						<span class="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 bg-white"></span>
						<span class="absolute top-1/2 right-0 h-px w-3 -translate-y-1/2 bg-white"></span>
					</div>

					<div class="flex flex-col gap-1.5 md:w-48">
						{@render readout('Works', String(listedWorks.length))}
						{@render readout('Format', '4K 16:9')}
						{@render readout('Look', 'Default')}
					</div>
				</div>

				<div class="grid grid-cols-2 gap-px md:grid-cols-4">
					<a
						href={`mailto:${EMAIL}`}
						class="group col-span-2 bg-white/15 px-4 py-3 backdrop-blur-md transition-colors hover:bg-white md:px-5 md:py-4"
					>
						<p
							class="font-mono text-[0.6rem] tracking-[0.3em] text-white/55 uppercase group-hover:text-black/60"
						>
							Mail
						</p>
						<p class="mt-1 truncate text-lg text-white group-hover:text-black md:text-2xl">
							{EMAIL}
						</p>
					</a>

					<a
						href={INSTAGRAM.href}
						target="_blank"
						rel="noreferrer"
						class="group bg-white/15 px-4 py-3 backdrop-blur-md transition-colors hover:bg-white md:px-5 md:py-4"
					>
						<div class="flex items-center gap-2 text-white/55 group-hover:text-black/60">
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<rect
									x="3.5"
									y="3.5"
									width="17"
									height="17"
									rx="5"
									stroke="currentColor"
									stroke-width="1.8"
								/>
								<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8" />
								<circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
							</svg>
							<p class="font-mono text-[0.6rem] tracking-[0.3em] uppercase">Instagram</p>
						</div>
						<p class="mt-1 truncate text-base text-white group-hover:text-black md:text-xl">
							{INSTAGRAM.handle}
						</p>
					</a>

					<a
						href={VIMEO.href}
						target="_blank"
						rel="noreferrer"
						class="group bg-white/15 px-4 py-3 backdrop-blur-md transition-colors hover:bg-white md:px-5 md:py-4"
					>
						<div class="flex items-center gap-2 text-white/55 group-hover:text-black/60">
							<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<rect
									x="3.5"
									y="3.5"
									width="17"
									height="17"
									stroke="currentColor"
									stroke-width="1.8"
								/>
								<path d="M10 8.5L15.5 12L10 15.5Z" fill="currentColor" />
							</svg>
							<p class="font-mono text-[0.6rem] tracking-[0.3em] uppercase">Vimeo</p>
						</div>
						<p class="mt-1 truncate text-base text-white group-hover:text-black md:text-xl">
							{VIMEO.handle}
						</p>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
