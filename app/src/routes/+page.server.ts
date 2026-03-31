import { getHomeTiles } from '$lib/server/works';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const tiles = await getHomeTiles();

		return { tiles };
	} catch (cause) {
		console.error('Failed to load works for the home page', cause);
		throw error(500, 'Failed to load works');
	}
};
