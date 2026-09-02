<script lang="ts">
	import WorksList from '$lib/components/works/WorksList.svelte';
	import WorksSplitView from '$lib/components/works/WorksSplitView.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="absolute top-16 right-0 bottom-0 left-0 overflow-hidden">
	<div class="hidden h-full w-full md:block">
		<WorksSplitView works={data.works} />
	</div>
	<div class="block h-full w-full md:hidden">
		<WorksList works={data.works} />
	</div>
</div>
