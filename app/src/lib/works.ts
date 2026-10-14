import generated from '$lib/content/generated/works.json';
import { getStills } from '$lib/stills';
import type { RawWork, WorksData } from '$lib/model/types';

const raw = generated as RawWork[];

function hydrate({ stillIds, coverStillId, ...work }: RawWork): WorksData {
	const stills = getStills(stillIds);

	// An unset, stale or foreign cover_still_id just falls back to the first
	// still, so nothing has to validate it.
	return {
		...work,
		stills,
		cover: stills.find((still) => still.id === coverStillId) ?? stills[0] ?? null
	};
}

function byOrder(field: 'listOrder' | 'homeOrder') {
	return (a: RawWork, b: RawWork) =>
		(a[field] ?? Infinity) - (b[field] ?? Infinity) || a.title.localeCompare(b.title);
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
