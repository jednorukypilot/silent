<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	function getVimeoEmbedUrl(videoLink: string | null) {
		if (!videoLink) return null;

		try {
			const url = new URL(videoLink);
			const pathSegments = url.pathname.split('/').filter(Boolean);
			const videoId = [...pathSegments].reverse().find((segment) => /^\d+$/.test(segment));

			if (!videoId) return null;

			const embedUrl = new URL(`https://player.vimeo.com/video/${videoId}`);
			const hash = url.searchParams.get('h');

			if (hash) {
				embedUrl.searchParams.set('h', hash);
			}

			embedUrl.searchParams.set('title', '0');
			embedUrl.searchParams.set('byline', '0');
			embedUrl.searchParams.set('portrait', '0');

			return embedUrl.toString();
		} catch {
			return null;
		}
	}

	const vimeoEmbedUrl = getVimeoEmbedUrl(data.work.videoLink);
</script>

<div class="absolute top-16 right-0 bottom-0 left-0 overflow-y-auto">
	<div class="flex flex-col bg-black text-white">
		<div class="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-black text-white">
			{#if vimeoEmbedUrl}
				<iframe
					title={`${data.work.title} Vimeo player`}
					src={vimeoEmbedUrl}
					class="h-full min-h-[calc(100dvh-4rem)] w-full"
					allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
					allowfullscreen
				></iframe>
			{:else}
				<div
					class="flex h-full min-h-[calc(100dvh-4rem)] w-full items-center justify-center border border-white/15 text-sm tracking-[0.3em] text-white/50 uppercase"
				>
					No video available
				</div>
			{/if}
		</div>
		<div class="flex flex-col items-start justify-start gap-2 bg-white px-8 py-4 text-black">
			<div class="flex w-full flex-row items-start justify-between gap-10 overflow-hidden">
				<h1 class="text-4xl">{data.work.title}</h1>
				<p class="hidden text-sm tracking-[0.3em] text-black/60 uppercase xl:inline">
					{data.work.id}
				</p>
			</div>
			<p class="text-lg text-black/80">{data.work.year}</p>
			<div
				class="mt-6 mb-4 flex w-full flex-row items-start justify-between gap-10 overflow-hidden"
			>
				<div class="flex flex-col gap-4">
					{#each (data.work.descriptionLong ?? '').split('\\n').filter(Boolean) as paragraph}
						<p class="text-lg text-black/80">{paragraph}</p>
					{/each}
				</div>
				{#if data.work.videoLink}
					<a
						href={data.work.videoLink}
						target="_blank"
						rel="noreferrer"
						class="text-lg text-black/80 underline"
					>
						Watch on Vimeo
					</a>
				{/if}
			</div>
		</div>
	</div>
</div>
