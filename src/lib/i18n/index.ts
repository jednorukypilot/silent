import { addMessages, init } from 'svelte-i18n';
import en from './dictionaries/en.json';

export const SUPPORTED = ['en'] as const;
export type Lang = typeof SUPPORTED[number];
export const DEFAULT_LANG: Lang = 'en';

// Load all dictionaries immediately
addMessages('en', en);

// Initialize immediately (sync) – no navigator, no async
init({
  fallbackLocale: DEFAULT_LANG,
  initialLocale: DEFAULT_LANG
});
