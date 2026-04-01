import type { WorksData } from '$lib/model/types';
import tiles from '$lib/content/generated/home-tiles.json';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		tiles: tiles as WorksData[]
	};
};