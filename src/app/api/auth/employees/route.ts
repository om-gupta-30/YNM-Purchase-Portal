import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, hasRole, authErrors } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return authErrors.unauthorized();
    }
    
    if (!hasRole(user, ['admin'])) {
      return authErrors.forbidden(user.role);
    }

    const { data: employees, error } = await supabaseAdmin
      .from('users')
      .select('id, username, role')
      .eq('role', 'employee')
      .order('username', { ascending: true });

    if (error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data: employees || [] });
  } catch (error) {
    console.error('Get employees error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get employees' },
      { status: 500 }
    );
  }
}
