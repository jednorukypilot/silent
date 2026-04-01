<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { MENU_TILES } from '$lib/model/menu';

	const menuStyle = $derived(`max-width: min(${MENU_TILES.length * 16}rem, 1200px);`);

	function handleNav(event: MouseEvent, href: string) {
		event.preventDefault();

		if (href === resolve('/')) {
			goto(href, { state: { skipHero: true } });
			return;
		}

		goto(href);
	}
</script>

<div class="fixed top-0 right-0 left-0 z-40 flex h-16 w-full justify-center bg-black">
	<div
		class="container flex h-full items-center justify-evenly gap-6 px-4 text-white"
		style={menuStyle}
	>
		{#each MENU_TILES as tile}
			<a href={tile.href} class="text-sm" onclick={(event) => handleNav(event, tile.href)}
				>{tile.title}</a
			>
		{/each}
	</div>
</div>
