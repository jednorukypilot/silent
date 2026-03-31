import type { Lang } from '$lib/i18n';
import { DEFAULT_LANG } from '$lib/i18n';

// Import all localized article files at build time
const articleFiles = import.meta.glob('$lib/content/*/home/articles.json', {
  eager: true,
  import: 'default'
}) as Record<string, any[]>;

// Helper to build the key path that import.meta.glob uses
const pathFor = (lang: Lang) => `/src/lib/content/${lang}/home/articles.json`;

export const load = async ({ parent }) => {
  // get current language from +layout
  const { lang } = await parent() as { lang: Lang };

  // choose localized version or fallback
  // const articles =
  //   articleFiles[pathFor(lang)] ??
  //   articleFiles[pathFor(DEFAULT_LANG)];

  // return { articles };
};
