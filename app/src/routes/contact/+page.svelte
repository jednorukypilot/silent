<script lang="ts">
	import { onMount } from 'svelte';
	import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';
	import { resolveBackdrop } from '$lib/backdrop';
	import type { Still } from '$lib/model/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

	<div class="pointer-events-none absolute inset-0 bg-black/30"></div>

	<div class="absolute inset-0 flex items-center justify-center">
		<h1 class="text-4xl text-white">Contact</h1>
	</div>
</div>
