import { getHomeTiles } from '$lib/server/works';
import { error } from '@sveltejs/kit';
import { hasSupabaseServerConfig } from '$lib/server/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	if (!hasSupabaseServerConfig) {
		console.warn('Supabase server configuration is missing. Returning no home tiles.');
		return { tiles: [] };
	}

	try {
		const tiles = await getHomeTiles();

		return { tiles };
	} catch (cause) {
		console.error('Failed to load works for the home page', cause);
		throw error(500, 'Failed to load works');
	}
};
