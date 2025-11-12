<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import '../app.css';
	import '$lib/i18n';

	import { locale, t } from 'svelte-i18n';
	import type { Lang } from '$lib/i18n';
	import Footer from '$lib/components/Footer.svelte';

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

<div class="flex min-h-screen flex-col">
	<!-- <TopBar />
	<Sidebar /> -->
	{@render children()}
	<!-- <Footer /> -->
</div>
