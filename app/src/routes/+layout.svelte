<script lang="ts">
	import OverlayHero from '$lib/components/OverlayHero.svelte';
	import '$lib/i18n';
	import '../app.css';

	import type { Lang } from '$lib/i18n';
	import { locale } from 'svelte-i18n';

	let { data, children } = $props<{ data: { lang: Lang }; children: any }>();

	$effect(() => {
		if (typeof window !== 'undefined') {
			locale.set(data.lang);
		}
	});

	function switchLang(next: Lang) {
		locale.set(next);
		document.cookie = `lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
		location.reload();
	}

	function handleIntroDone() {
		console.log('intro finished');
		// put any external behavior here
	}
</script>

<div class="relative h-screen">
	<OverlayHero onIntroDone={handleIntroDone} />
	{@render children()}
</div>
