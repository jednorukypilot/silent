import { error } from '@sveltejs/kit';
import { allWorks, workById } from '$lib/works';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => allWorks.map(({ id }) => ({ id }));

export const load: PageLoad = ({ params }) => {
	const work = workById(params.id);

	if (!work) {
		throw error(404, 'Work not found');
	}

	return {
		work
	};
};
