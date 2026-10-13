import type { Still, Surface } from '$lib/model/types';

/**
 * When a surface decides which still backs it.
 *
 * 'build' — chosen while the site is built. The still is baked into the
 *   prerendered HTML, so the browser starts downloading it while it parses the
 *   page, before any JavaScript runs. Appears fastest. Every visitor sees the
 *   same image until the next build (it is re-rolled on each build, and on
 *   client-side navigations into the page).
 *
 * 'visit' — chosen in the browser once the page has hydrated. A different still
 *   on every visit, but nothing is in the HTML, so the request cannot even start
 *   until the JavaScript has loaded and run. Noticeably slower to appear.
 *
 * Flip a surface between the two here; nothing else needs changing.
 */
export type BackdropStrategy = 'build' | 'visit';

export const BACKDROP_STRATEGY: Record<Surface, BackdropStrategy> = {
	hero: 'build',
	contact: 'visit'
};

export type Backdrop = {
	/** Non-null under 'build': render this straight away, no waiting. */
	chosen: Still | null;
	/** What 'visit' picks from once the page is live. */
	candidates: Still[];
};

function pickOne(stills: Still[]): Still | null {
	if (stills.length === 0) return null;

	return stills[Math.floor(Math.random() * stills.length)];
}

/** Called from a page's load function, so 'build' resolves during prerender. */
export function backdropFor(surface: Surface, candidates: Still[]): Backdrop {
	return {
		chosen: BACKDROP_STRATEGY[surface] === 'build' ? pickOne(candidates) : null,
		candidates
	};
}

/**
 * Called from the component on mount. Under 'build' this returns the still that
 * is already on screen, so nothing swaps; under 'visit' it makes the choice.
 */
export function resolveBackdrop(backdrop: Backdrop): Still | null {
	return backdrop.chosen ?? pickOne(backdrop.candidates);
}
