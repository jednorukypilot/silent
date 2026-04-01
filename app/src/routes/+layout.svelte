<script lang="ts">
	import '$lib/i18n';
	import '../app.css';

	import type { Lang } from '$lib/i18n';
	import { locale } from 'svelte-i18n';
	import TopBar from '$lib/components/TopBar.svelte';

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
</script>

<div class="relative h-screen">
	<TopBar />
	{@render children()}
</div>
