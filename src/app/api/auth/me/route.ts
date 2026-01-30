import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return authErrors.unauthorized();
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, username, role, created_at')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, user: userData });
  } catch (error) {
    console.error('Get me error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get user' },
      { status: 500 }
    );
  }
}
