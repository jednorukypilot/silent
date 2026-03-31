<script lang="ts">
	import { faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { t } from 'svelte-i18n';
	import { asset } from '$app/paths';
	import { route } from '$lib/utils/paths';
</script>

<footer class="flex-flex-col items-center justify-center bg-gray-900 px-6 pt-16 pb-10">
	<div
		class="flex flex-col items-start justify-evenly gap-12 text-center text-sm text-white md:flex-row"
	>
		<div class="flex flex-col items-start justify-start">
			<img src={asset('/images/logos/logo-inverz.svg')} alt="logo" class="flex h-12" />
		</div>
		<div class="flex h-full flex-col items-start">
			<h3 class="text-secondary mb-4 font-serif text-xl font-bold">{$t('footer.navigation')}</h3>
			<a href={route('/catalog')} class="mb-2 underline">{$t('footer.offers')}</a>
			<a href={route('/#faq')} class="mb-2 underline">{$t('footer.faq')}</a>
			<a href={route('/important-links')} class="mb-2 underline">{$t('footer.important_links')}</a>
		</div>
		<div class="flex h-full flex-col items-start">
			<h3 class="text-primary mb-4 font-serif text-xl font-bold">{$t('footer.contact')}</h3>
			<div class="flex flex-row items-center justify-center p-2">
				<FontAwesomeIcon icon={faPhone} class="h-6 text-white" />
				<a href="tel:+420123456789" class="ml-2 underline"> {$t('phone')} </a>
			</div>
			<div class="flex flex-row items-center justify-center p-2">
				<FontAwesomeIcon icon={faEnvelope} class="h-6 text-white" />
				<a href="mailto:info@realityindonesie.cz" class="ml-2 underline"> {$t('mail')} </a>
			</div>
		</div>
	</div>
	<div
		class="mx-24 mt-12 flex flex-row items-start justify-between text-center text-sm text-gray-400"
	>
		<span>&copy; {new Date().getFullYear()} {$t('footer.name')}.</span>
		<span></span>
	</div>
</footer>
