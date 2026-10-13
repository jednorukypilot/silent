<script lang="ts">
	import { stillSrcset, stillUrl } from '$lib/stills';

	let {
		fileKey,
		lqip = null,
		debugLabel = 'unknown image',
		alt = '',
		aspectRatio,
		sizes = '(min-width: 1200px) 33vw, (min-width: 700px) 50vw, 100vw',
		eager = false,
		objectFit = 'cover',
		objectPosition = 'center',
		background = '#111827'
	}: {
		fileKey: string | null | undefined;
		lqip?: string | null;
		debugLabel?: string;
		alt?: string;
		aspectRatio: number;
		sizes?: string;
		eager?: boolean;
		objectFit?: 'cover' | 'contain';
		objectPosition?: string;
		background?: string;
	} = $props();

	let loaded = $state(false);
	let imageEl = $state<HTMLImageElement | null>(null);
	let hasLoggedMissingFileKey = false;

	const hasImage = $derived(Boolean(fileKey));
	const src = $derived(fileKey ? stillUrl(fileKey, 'w960') : undefined);
	const srcset = $derived(fileKey ? stillSrcset(fileKey) : undefined);

	// A cached image can finish loading before this component attaches its load
	// handler — on a prerendered page that is the common case — which would
	// otherwise leave the placeholder up permanently.
	$effect(() => {
		if (imageEl?.complete) {
			loaded = true;
		}
	});

	$effect(() => {
		if (!hasImage && !hasLoggedMissingFileKey) {
			hasLoggedMissingFileKey = true;
			console.warn(`[ResponsiveImage] Missing fileKey for ${debugLabel}`, { alt });
		}
	});
</script>

<div
	class="image-shell"
	class:is-loaded={loaded}
	style={`aspect-ratio: ${aspectRatio}; background: ${background};`}
>
	{#if lqip}
		<img
			class="image-lqip"
			class:is-cover={objectFit === 'cover'}
			src={lqip}
			alt=""
			aria-hidden="true"
			style={`object-fit: ${objectFit}; object-position: ${objectPosition};`}
		/>
	{:else if background !== 'transparent'}
		<div class="image-placeholder" aria-hidden="true"></div>
	{/if}
	{#if hasImage}
		<img
			bind:this={imageEl}
			class="image-main"
			{src}
			{srcset}
			{sizes}
			{alt}
			style={`object-fit: ${objectFit}; object-position: ${objectPosition};`}
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			fetchpriority={eager ? 'high' : 'auto'}
			onload={() => {
				loaded = true;
			}}
			onerror={() => {
				// Leave the blurred placeholder in place rather than revealing a broken
				// image, but say so, since a missing size variant is otherwise invisible.
				console.warn(`[ResponsiveImage] Failed to load ${debugLabel}`, { src });
			}}
		/>
	{/if}
</div>

<style>
	.image-shell {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #111827;
	}

	.image-placeholder {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			115deg,
			rgba(127, 127, 127, 0.05) 20%,
			rgba(127, 127, 127, 0.18) 32%,
			rgba(127, 127, 127, 0.05) 44%
		);
		background-size: 220% 100%;
		animation: shimmer 5.8s linear infinite;
		pointer-events: none;
	}

	/* The real image is painted on top of this, so with object-fit: cover the
	   placeholder stops being visible the instant the image decodes — no fade is
	   needed and none is wanted, since a fade would keep the blur on screen
	   after the image is already available. The transition below only matters
	   for object-fit: contain, where the placeholder shows around the letterbox
	   and has to be taken away explicitly. */
	.image-lqip {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		filter: blur(16px);
		transition: opacity 160ms ease;
		pointer-events: none;
	}

	/* Cover fills the box, so the blur's soft edge is clipped by the shell and the
	   scale hides it entirely. Contain letterboxes, where scaling up would smear
	   the blur past where the image actually sits. */
	.image-lqip.is-cover {
		transform: scale(1.1);
	}

	.image-shell.is-loaded .image-lqip {
		opacity: 0;
	}

	.image-main {
		position: relative;
		width: 100%;
		height: 100%;
		display: block;
	}

	.image-shell.is-loaded .image-placeholder {
		opacity: 0;
		animation: none;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}

		100% {
			background-position: -20% 0;
		}
	}
</style>
