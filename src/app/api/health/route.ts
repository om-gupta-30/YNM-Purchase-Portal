import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    const dbStatus = error && error.code === 'PGRST116' ? 'tables_not_created' : 'connected';
    
    return Response.json({
      status: 'ok',
      db: dbStatus
    });
  } catch {
    return Response.json({
      status: 'ok',
      db: 'error'
    });
  }
}
