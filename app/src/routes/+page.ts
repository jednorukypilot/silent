import { homeWorks } from '$lib/works';
import { placedStills } from '$lib/stills';
import { backdropFor } from '$lib/backdrop';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		tiles: homeWorks,
		hero: backdropFor('hero', placedStills('hero'))
	};
};
