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
	const VIMEO = 'https://vimeo.com/showcase/12465261?fl=so';
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

			<div class="h-[max(33.333%,11rem)] max-h-[55%] w-full shrink-0 border-2 border-white"></div>

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
						class="flex h-10 w-10 items-center justify-center border-2 border-white text-white transition-colors hover:bg-white hover:text-black"
						aria-label="Vimeo"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M23.9765 6.4168c-.105 2.338-1.739 5.5429-4.894 9.6088-3.2679 4.247-6.0258 6.3699-8.2898 6.3699-1.409 0-2.578-1.294-3.553-3.881l-1.9179-7.1138c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.8809 1.132l-1.129-1.457a315.06 315.06 0 003.501-3.1279c1.579-1.368 2.765-2.085 3.5539-2.159 1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.5069.5389 2.45 1.1309 3.674 1.7759 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.8679 3.434-5.7568 6.7619-5.6368 2.4729.06 3.6279 1.664 3.4929 4.7969z"
							/>
						</svg>
					</a>
					<a
						href={INSTAGRAM}
						target="_blank"
						rel="noreferrer"
						class="flex h-10 w-10 items-center justify-center border-2 border-white text-white transition-colors hover:bg-white hover:text-black"
						aria-label="Instagram"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
							/>
						</svg>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
