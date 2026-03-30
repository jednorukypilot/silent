import type { Lang } from '$lib/i18n';
import { DEFAULT_LANG } from '$lib/i18n';

export const prerender = true;

export const load = async () => {
	const lang: Lang = DEFAULT_LANG;

	return { lang };
};
