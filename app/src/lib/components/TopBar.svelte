<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { MENU_TILES } from '$lib/model/menu';

	let mobileMenuOpen = $state(false);

	const menuStyle = $derived(`max-width: min(${MENU_TILES.length * 16}rem, 1200px);`);

	function handleNav(event: MouseEvent, href: string) {
		event.preventDefault();
		mobileMenuOpen = false;

		if (href === resolve('/')) {
			goto(href, { state: { skipHero: true } });
			return;
		}

		goto(href);
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<div class="fixed top-0 right-0 left-0 z-40 flex h-16 w-full justify-center bg-black">
	<div class="flex h-full w-full items-center justify-between">
		<a
			class="m-2 flex h-10 w-10 items-center justify-center border-2 border-white p-2 text-white"
			href={resolve('/')}
		>
			kt
		</a>
		<div
			class="container hidden h-full items-center justify-evenly gap-6 px-4 text-white md:flex"
			style={menuStyle}
		>
			{#each MENU_TILES as tile}
				<a href={tile.href} class="text-sm" onclick={(event) => handleNav(event, tile.href)}
					>{tile.title}</a
				>
			{/each}
		</div>

		<div class="hidden w-10 md:block"></div>

		<button
			type="button"
			class="m-2 flex h-10 w-10 flex-col items-center justify-center gap-1.5 text-white md:hidden"
			onclick={toggleMobileMenu}
			aria-label="Toggle navigation menu"
			aria-expanded={mobileMenuOpen}
		>
			<span
				class={`block h-0.5 w-5 bg-white transition-transform duration-200 ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
			></span>
			<span
				class={`block h-0.5 w-5 bg-white transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}
			></span>
			<span
				class={`block h-0.5 w-5 bg-white transition-transform duration-200 ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
			></span>
		</button>
	</div>

	{#if mobileMenuOpen}
		<div class="absolute top-16 right-0 left-0 border-t border-white/20 bg-black md:hidden">
			<nav class="flex flex-col px-4 py-3" aria-label="Mobile navigation">
				{#each MENU_TILES as tile}
					<a
						href={tile.href}
						class="border-b border-white/10 py-3 text-sm text-white last:border-b-0"
						onclick={(event) => handleNav(event, tile.href)}
					>
						{tile.title}
					</a>
				{/each}
			</nav>
		</div>
	{/if}
</div>
