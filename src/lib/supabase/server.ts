import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server client - uses service role key for server-side operations
function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Lazy initialization singleton
let _supabaseAdmin: SupabaseClient | null = null;

export const supabaseAdmin = {
  from: (table: string) => {
    if (!_supabaseAdmin) _supabaseAdmin = getSupabaseAdmin();
    return _supabaseAdmin.from(table);
  }
};

// Test connection
export async function testConnection() {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { success: false, error };
  }
}
