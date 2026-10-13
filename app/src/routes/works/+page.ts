import { listedWorks } from '$lib/works';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		works: listedWorks
	};
};
