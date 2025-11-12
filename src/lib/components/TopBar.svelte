<script lang="ts">
	import type { MenuTile } from '../types';
	import { MENU_TILES } from '../config/menu';
	import { faPhone } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { t } from 'svelte-i18n';
	import { base } from '$app/paths';
</script>

<div class="flex flex-col">
	<div class="bg-primary hidden min-h-14 flex-row items-center justify-center p-4 md:flex">
		<span class="text-center text-gray-100">
			{$t('header.need_help')}
			<a href="tel:+420123456789" class="ml-2 underline"> {$t('phone')}</a>
		</span>
	</div>
	<div
		class="flex min-h-[86px] flex-row items-center justify-between gap-4 border-b-2 bg-white px-4 py-2 md:justify-evenly md:gap-8"
	>
		<a href="{base}/">
			<img src="{base}/images/logos/logo.svg" alt="logo" class="flex h-16" />
		</a>
		<nav class="hidden flex-row items-center justify-center p-2 md:flex">
			{#each MENU_TILES as tile}
				<a href="{base}{tile.link}" class="text-neutral-content mx-4 hover:underline"
					>{tile.title}</a
				>
			{/each}
		</nav>
		<div class="hidden flex-row items-center justify-center p-2 md:flex">
			<FontAwesomeIcon icon={faPhone} class="text-secondary h-6" />
			<a href="tel:+420123456789" class="ml-2 underline"> {$t('phone')} </a>
		</div>

		<button
			class="md:hidden"
			on:click={() => {
				const event = new CustomEvent('toggleSidebar');
				window.dispatchEvent(event);
			}}
		>
			<img src="{base}/images/icons/burger.svg" alt="menu" class="h-8 w-8" />
		</button>
	</div>
</div>
