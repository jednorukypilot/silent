<script lang="ts">
	import { goto } from '$app/navigation';
	import { asset, resolve } from '$app/paths';
	import { MENU_TILES } from '$lib/model/menu';

	let mobileMenuOpen = $state(false);

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
	<div class="flex h-full w-full items-center">
		<a
			class="m-2 flex h-10 w-10 items-center justify-center border-2 border-white p-2"
			href={resolve('/')}
		>
			<img src={asset('/logo.svg')} alt="Logo" class="h-full w-full object-contain invert" />
		</a>
		<div class="mr-4 ml-auto hidden items-center gap-2 text-white md:flex">
			{#each MENU_TILES as tile, i}
				{#if i > 0}
					<svg
						class="mx-1 h-8 w-5 text-white/90"
						viewBox="0 0 12 20"
						fill="none"
						aria-hidden="true"
					>
						<path d="M9 3L3 17" stroke="currentColor" stroke-width="1.5" />
					</svg>
				{/if}
				<a href={tile.href} class="text-sm" onclick={(event) => handleNav(event, tile.href)}
					>{tile.title}</a
				>
			{/each}
		</div>

		<button
			type="button"
			class="m-2 ml-auto flex h-10 w-10 items-center justify-center text-white md:hidden"
			onclick={toggleMobileMenu}
			aria-label="Toggle navigation menu"
			aria-expanded={mobileMenuOpen}
		>
			<svg class="h-6 w-9" viewBox="0 0 30 20" fill="none" aria-hidden="true">
				<g
					class={`transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}
				>
					<path d="M9 3L3 17" stroke="currentColor" stroke-width="1.5" />
					<path d="M18 3L12 17" stroke="currentColor" stroke-width="1.5" />
					<path d="M27 3L21 17" stroke="currentColor" stroke-width="1.5" />
				</g>
				<g
					class={`transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
				>
					<path d="M18 3L12 17" stroke="currentColor" stroke-width="1.5" />
					<path d="M12 3L18 17" stroke="currentColor" stroke-width="1.5" />
				</g>
			</svg>
		</button>
	</div>

	{#if mobileMenuOpen}
		<div class="absolute top-16 right-0 left-0 border-t border-white/20 bg-black md:hidden">
			<nav class="flex flex-col px-4 py-3" aria-label="Mobile navigation">
				{#each MENU_TILES as tile}
					<a
						href={tile.href}
						class="py-3 text-sm text-white last:border-b-0"
						onclick={(event) => handleNav(event, tile.href)}
					>
						{tile.title}
					</a>
				{/each}
			</nav>
		</div>
	{/if}
</div>
