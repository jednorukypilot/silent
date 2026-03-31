<script lang="ts">
	import { imageUrl } from '$lib/utils/imageUrl';

	let {
		fileKey,
		alt = '',
		aspectRatio,
		sizes = '(min-width: 1200px) 33vw, (min-width: 700px) 50vw, 100vw',
		eager = false
	}: {
		fileKey: string;
		alt?: string;
		aspectRatio: number;
		sizes?: string;
		eager?: boolean;
	} = $props();

	let loaded = $state(false);
</script>

<div class="image-shell" class:is-loaded={loaded} style={`aspect-ratio: ${aspectRatio};`}>
	<div class="image-placeholder" aria-hidden="true"></div>
	<img
		src={imageUrl(fileKey, 'w960')}
		srcset={`
      ${imageUrl(fileKey, 'w480')} 480w,
      ${imageUrl(fileKey, 'w960')} 960w,
      ${imageUrl(fileKey, 'w1600')} 1600w
    `}
		{sizes}
		{alt}
		loading={eager ? 'eager' : 'lazy'}
		decoding="async"
		fetchpriority={eager ? 'high' : 'auto'}
		onload={() => {
			loaded = true;
		}}
	/>
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
		background:
			linear-gradient(
				115deg,
				rgba(255, 255, 255, 0.05) 20%,
				rgba(255, 255, 255, 0.18) 32%,
				rgba(255, 255, 255, 0.05) 44%
			),
			linear-gradient(180deg, rgba(17, 24, 39, 0.7), rgba(17, 24, 39, 0.95));
		background-size:
			220% 100%,
			100% 100%;
		animation: shimmer 1.8s linear infinite;
		transition: opacity 220ms ease;
		pointer-events: none;
	}

	img {
		position: relative;
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
		opacity: 0;
		transform: scale(1.035);
		transition:
			opacity 280ms ease,
			transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.image-shell.is-loaded .image-placeholder {
		opacity: 0;
		animation: none;
	}

	.image-shell.is-loaded img {
		opacity: 1;
		transform: scale(1);
	}

	@keyframes shimmer {
		0% {
			background-position:
				200% 0,
				0 0;
		}

		100% {
			background-position:
				-20% 0,
				0 0;
		}
	}
</style>
