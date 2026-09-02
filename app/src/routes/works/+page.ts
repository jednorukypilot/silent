import type { WorksData } from '$lib/model/types';
import works from '$lib/content/generated/works-list.json';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		works: works as WorksData[]
	};
};
