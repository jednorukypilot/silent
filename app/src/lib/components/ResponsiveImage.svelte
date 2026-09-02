<script lang="ts">
	let {
		imageUrls,
		debugLabel = 'unknown image',
		alt = '',
		aspectRatio,
		sizes = '(min-width: 1200px) 33vw, (min-width: 700px) 50vw, 100vw',
		eager = false,
		objectFit = 'cover',
		objectPosition = 'center',
		background = '#111827'
	}: {
		imageUrls: {
			w480: string;
			w960: string;
			w1600: string;
		};
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
	let hasLoggedMissingImageUrls = false;
	const hasImageUrls = $derived(Boolean(imageUrls?.w480 && imageUrls?.w960 && imageUrls?.w1600));
	const srcset = $derived(
		hasImageUrls
			? `${imageUrls.w480} 480w, ${imageUrls.w960} 960w, ${imageUrls.w1600} 1600w`
			: undefined
	);

	$effect(() => {
		if (!hasImageUrls && !hasLoggedMissingImageUrls) {
			hasLoggedMissingImageUrls = true;
			console.warn(`[ResponsiveImage] Missing imageUrls for ${debugLabel}`, { imageUrls, alt });
		}
	});
</script>

<div
	class="image-shell"
	class:is-loaded={loaded}
	style={`aspect-ratio: ${aspectRatio}; background: ${background};`}
>
	{#if background !== 'transparent'}
		<div class="image-placeholder" aria-hidden="true"></div>
	{/if}
	{#if hasImageUrls}
		<img
			src={imageUrls.w960}
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

	img {
		position: relative;
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
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
