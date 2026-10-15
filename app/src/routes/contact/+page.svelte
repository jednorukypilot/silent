<script lang="ts">
	import { onMount } from 'svelte';
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import { resolveBackdrop } from '$lib/backdrop';
	import type { Still } from '$lib/model/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const NAME = 'Kryštof Tichý';
	const ROLE = 'cinematographer';
	const EMAIL = 'silentdp@icloud.com';
	// PLACEHOLDER URLs — the handles are not known yet.
	const VIMEO = 'https://vimeo.com/user30177605';
	const INSTAGRAM = 'https://www.instagram.com/krystoftichy/';

	// Null until mount under the 'visit' strategy, already set under 'build'.
	// See $lib/backdrop.ts to switch this page between the two.
	let still = $state<Still | null>(data.contact.chosen);

	onMount(() => {
		still = resolveBackdrop(data.contact);
	});
</script>

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

	<!-- A light scrim only: the labels are thin white type and some stills come in
	     bright enough to swallow them. -->
	<div class="pointer-events-none absolute inset-0 bg-black/30"></div>

	<div class="absolute inset-0 px-6 py-8 md:px-8">
		<!-- h-full so the frame's percentage height resolves: on a wide screen it is a
		     third of each axis, i.e. the middle ninth. The max() floors take over once a
		     third would be too small to read as a frame, and the min()/max-h keep the
		     padding above from ever being eaten. -->
		<div class="mx-auto flex h-full w-[min(100%,max(33.333%,28rem))] flex-col justify-center gap-3">
			<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
				<p class="text-base tracking-wide text-white md:text-lg">{NAME}</p>
				<p class="text-base tracking-wide text-white md:text-lg">{ROLE}</p>
			</div>

			<div class="h-[max(33.333%,11rem)] max-h-[55%] w-full shrink-0 border border-white"></div>

			<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
				<a
					href={`mailto:${EMAIL}`}
					class="text-base tracking-wide text-white underline-offset-8 hover:underline md:text-lg"
				>
					{EMAIL}
				</a>
				<div class="flex items-center gap-2">
					<a
						href={VIMEO}
						target="_blank"
						rel="noreferrer"
						class="flex h-10 w-10 items-center justify-center border border-white text-base text-white transition-colors hover:bg-white hover:text-black md:text-lg"
						aria-label="Vimeo"
					>
						V
					</a>
					<a
						href={INSTAGRAM}
						target="_blank"
						rel="noreferrer"
						class="flex h-10 w-10 items-center justify-center border border-white text-base text-white transition-colors hover:bg-white hover:text-black md:text-lg"
						aria-label="Instagram"
					>
						IG
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
