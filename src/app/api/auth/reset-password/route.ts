import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validatePassword } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { username, newPassword } = await request.json();

    if (!username || !newPassword) {
      return Response.json(
        { success: false, message: 'Username and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return Response.json(
        { success: false, message: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Find user by username
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Database error finding user:', findError);
      return Response.json(
        { success: false, message: 'Database error' },
        { status: 500 }
      );
    }

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update password (plain text for now - same as existing login system)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('Database error updating password:', updateError);
      return Response.json(
        { success: false, message: 'Failed to update password' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return Response.json(
      { success: false, message: 'Password reset failed' },
      { status: 500 }
    );
  }
}
