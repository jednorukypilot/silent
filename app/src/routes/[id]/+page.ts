import { error } from '@sveltejs/kit';
import worksList from '$lib/content/generated/works-list.json';
import type { WorksData } from '$lib/model/types';
import type { EntryGenerator, PageLoad } from './$types';

const works = worksList as WorksData[];

export const entries: EntryGenerator = () => works.map(({ id }) => ({ id }));

export const load: PageLoad = ({ params }) => {
	const work = works.find(({ id }) => id === params.id);

	if (!work) {
		throw error(404, 'Work not found');
	}

	return {
		work
	};
};
