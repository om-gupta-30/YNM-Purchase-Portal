import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { success: false, message: 'Please provide username and password' },
        { status: 400 }
      );
    }

    // Find user by username
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Database error during login:', findError);
      if (findError.code === 'PGRST116' || findError.message.includes('relation') || findError.message.includes('does not exist')) {
        return Response.json(
          { success: false, message: 'Database tables not found. Please run the SQL migration in Supabase first.' },
          { status: 500 }
        );
      }
      return Response.json(
        { success: false, message: 'Database error: ' + findError.message },
        { status: 500 }
      );
    }

    if (!user) {
      return Response.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare password (plain text comparison)
    if (password !== user.password) {
      return Response.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await generateToken(user.id);

    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    );
  }
}
