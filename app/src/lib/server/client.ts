import type { Database } from '$lib/model/database.types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

export const hasSupabaseServerConfig = Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY);

let supabaseServerClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseServerClient() {
	if (!hasSupabaseServerConfig) {
		throw new Error('Supabase server configuration is missing.');
	}

	if (!supabaseServerClient) {
		supabaseServerClient = createClient<Database>(
			env.SUPABASE_URL!,
			env.SUPABASE_PUBLISHABLE_KEY!,
			{
				auth: {
					persistSession: false,
					autoRefreshToken: false
				}
			}
		);
	}

	return supabaseServerClient;
}
