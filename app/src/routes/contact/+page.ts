import { allStills, placedStills } from '$lib/stills';
import { backdropFor } from '$lib/backdrop';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// Until contact backdrops are curated in still_placements, any still may be
	// used — which is what this page did before placements existed.
	const curated = placedStills('contact');

	return {
		contact: backdropFor('contact', curated.length > 0 ? curated : allStills())
	};
};
