<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="absolute top-16 right-0 bottom-0 left-0 overflow-y-auto">
	<div class="flex flex-col bg-black text-white">
		<div class="flex min-h-[calc(100dvh-4rem)] border-2 border-white bg-black text-white">
			VIMEO
		</div>
		<div class="flex flex-col items-start justify-start gap-2 bg-white px-8 py-4 text-black">
			<div class="flex w-full flex-row items-start justify-between gap-10 overflow-hidden">
				<h1 class="text-4xl">{data.work.title}</h1>
				<p class="text-sm tracking-[0.3em] text-black/60 uppercase">{data.work.id}</p>
			</div>
			<p class="text-lg text-black/80">{data.work.year}</p>
			<div
				class="mt-6 mb-4 flex w-full flex-row items-start justify-between gap-10 overflow-hidden"
			>
				<p class=" text-lg text-black/80">{data.work.description}</p>
				<a href={data.work.videoLink} target="_blank" class="text-lg text-black/80 underline">
					Watch on Vimeo
				</a>
			</div>
		</div>
	</div>
</div>
