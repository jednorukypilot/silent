<script lang="ts">
	export let images: {
		small: { '1x': string; '2x': string };
		large: { '1x': string; '2x': string };
	};

	export let height: number = 582;

	$: heightStyle = `height: ${height}px;`;
</script>

<section
	class="relative flex w-full items-center justify-center overflow-hidden"
	style={heightStyle}
>
	<picture class="absolute inset-0 block h-full w-full">
		<!-- Small screens -->
		<source
			srcset={`${images.small['1x']} 1x, ${images.small['2x']} 2x`}
			media="(max-width: 640px)"
		/>

		<!-- Larger screens -->
		<source
			srcset={`${images.large['1x']} 1x, ${images.large['2x']} 2x`}
			media="(min-width: 641px)"
		/>

		<!-- Fallback image -->
		<img
			src={images.large['1x']}
			alt="Hero background"
			class="h-full w-full object-cover object-center"
		/>
	</picture>
</section>
