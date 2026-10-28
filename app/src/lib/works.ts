import generated from '$lib/content/generated/works.json';
import { getStills } from '$lib/stills';
import type { RawWork, WorksData } from '$lib/model/types';

const raw = generated as RawWork[];

function hydrate({ stillIds, coverStillId, smallCoverStillId, ...work }: RawWork): WorksData {
	const stills = getStills(stillIds);

	// An unset, stale or foreign id just falls back to the first still, so neither
	// column has to be validated. The two are independent: /works and the
	// small-display home viewer can lead with different frames.
	const pick = (id: string | null) =>
		stills.find((still) => still.id === id) ?? stills[0] ?? null;

	return {
		...work,
		stills,
		cover: pick(coverStillId),
		smallCover: pick(smallCoverStillId)
	};
}

// Highest number first, so a new work takes the top slot by being given a number
// above everything else instead of renumbering the works already there. Ties
// break on title. Stills keep their own ascending sort_order; this is works only.
function byOrder(field: 'listOrder' | 'homeOrder') {
	return (a: RawWork, b: RawWork) =>
		(b[field] ?? -Infinity) - (a[field] ?? -Infinity) || a.title.localeCompare(b.title);
}

function ordered(field: 'listOrder' | 'homeOrder'): WorksData[] {
	return raw
		.filter((work) => work[field] !== null)
		.sort(byOrder(field))
		.map(hydrate);
}

/** Works shown on /works, in `displayed` order. */
export const listedWorks: WorksData[] = ordered('listOrder');

/** Works shown on the home page, in `highlighted` order. */
export const homeWorks: WorksData[] = ordered('homeOrder');

/** Every work with a detail page, listed or not. */
export const allWorks: WorksData[] = raw.map(hydrate);

export function workById(id: string): WorksData | null {
	return allWorks.find((work) => work.id === id) ?? null;
}
