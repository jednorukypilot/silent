<script lang="ts">
	import type { MenuTile } from '$lib/types';
	import { MENU_TILES } from '$lib/config/menu';
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPhone, faTimes } from '@fortawesome/free-solid-svg-icons';
	import { base } from '$app/paths';

	let isOpen = false;
	let sidebarElement: HTMLElement;

	function toggleSidebar() {
		isOpen = !isOpen;
	}

	function closeSidebar() {
		isOpen = false;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeSidebar();
		}
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			closeSidebar();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeSidebar();
		}
	}

	onMount(() => {
		const handleToggle = () => toggleSidebar();
		window.addEventListener('toggleSidebar', handleToggle);

		return () => {
			window.removeEventListener('toggleSidebar', handleToggle);
		};
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Backdrop -->
{#if isOpen}
	<div
		class="bg-opacity-50 fixed inset-0 z-40 bg-black/60 transition-opacity duration-300"
		on:click={handleBackdropClick}
		on:keydown={handleBackdropKeydown}
		role="button"
		tabindex="0"
		aria-label="Close menu"
	></div>
{/if}

<!-- Sidebar -->
<div
	bind:this={sidebarElement}
	class="fixed top-0 right-0 z-50 h-full w-80 transform bg-white shadow-lg transition-transform duration-300 ease-in-out {isOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
>
	<!-- Header -->
	<div class="flex items-center justify-between border-b p-6">
		<img src="{base}/images/logos/logo.svg" alt="logo" class="h-12" />
		<button
			on:click={closeSidebar}
			class="rounded-full p-2 transition-colors hover:bg-gray-100"
			aria-label="Close menu"
		>
			<FontAwesomeIcon icon={faTimes} class="h-6 w-6 text-gray-600" />
		</button>
	</div>

	<!-- Navigation Menu -->
	<nav class="py-6">
		{#each MENU_TILES as tile}
			<a
				href="{base}{tile.link}"
				class="hover:text-primary block border-b border-gray-100 px-6 py-4 text-lg text-gray-800 transition-colors last:border-b-0 hover:bg-gray-100"
				on:click={closeSidebar}
			>
				{tile.title}
			</a>
		{/each}
	</nav>

	<!-- Contact Section -->
	<div class="absolute right-0 bottom-0 left-0 border-t bg-gray-50 p-6">
		<div class="text-center">
			<p class="mb-3 text-sm text-gray-600">
				{$t('header.need_help')}
			</p>
			<a
				href="tel:+420123456789"
				class="bg-primary hover:bg-primary-dark flex items-center justify-center rounded-lg px-4 py-3 text-white transition-colors"
			>
				<FontAwesomeIcon icon={faPhone} class="mr-2 h-4 w-4" />
				{$t('phone')}
			</a>
		</div>
	</div>
</div>
