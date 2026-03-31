import type { Database } from '$lib/model/database.types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '$env/static/private';

export const supabaseServerClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		persistSession: false,
		autoRefreshToken: false
	}
});
