import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return Response.json(
        { exists: false, message: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if username exists
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Database error during username verification:', error);
      return Response.json(
        { exists: false, message: 'Database error' },
        { status: 500 }
      );
    }

    return Response.json({
      exists: !!user,
    });
  } catch (error) {
    console.error('Username verification error:', error);
    return Response.json(
      { exists: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}
