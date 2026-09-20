<script lang="ts">
	import '../app.css';

	import TopBar from '$lib/components/TopBar.svelte';

	let { children } = $props<{ children: any }>();
</script>

<div class="relative h-screen">
	<TopBar />
	{@render children()}
</div>
