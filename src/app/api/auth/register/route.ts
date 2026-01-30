import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateToken, getUserFromRequest, hasRole, authErrors } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return authErrors.unauthorized();
    }
    
    if (!hasRole(user, ['admin'])) {
      return authErrors.forbidden(user.role);
    }

    const { username, password, role } = await request.json();

    if (!username || !password) {
      return Response.json(
        { success: false, message: 'Please provide username and password' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1)
      .single();

    if (existingUser) {
      return Response.json(
        { success: false, message: 'User already exists' },
        { status: 400 }
      );
    }

    // Create user with plain text password
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        username,
        password,
        role: role || 'employee'
      })
      .select()
      .single();

    if (insertError) {
      return Response.json(
        { success: false, message: insertError.message },
        { status: 500 }
      );
    }

    const token = await generateToken(newUser.id);

    return Response.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
