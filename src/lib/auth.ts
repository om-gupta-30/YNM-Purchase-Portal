import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase/server';
import { UserPayload } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT Token
export async function generateToken(userId: number): Promise<string> {
  const token = await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRE)
    .setIssuedAt()
    .sign(JWT_SECRET);
  
  return token;
}

// Verify JWT Token
export async function verifyToken(token: string): Promise<{ id: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: number };
  } catch {
    return null;
  }
}

// Get token from request
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  return null;
}

// Verify and get user from request
export async function getUserFromRequest(request: NextRequest): Promise<UserPayload | null> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return null;
  }
  
  const decoded = await verifyToken(token);
  
  if (!decoded) {
    return null;
  }
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, role')
    .eq('id', decoded.id)
    .single();
  
  if (error || !user) {
    return null;
  }
  
  return user as UserPayload;
}

// Check if user has required role
export function hasRole(user: UserPayload | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

// Auth error responses
export const authErrors = {
  unauthorized: () => Response.json(
    { success: false, message: 'Not authorized to access this route' },
    { status: 401 }
  ),
  forbidden: (role: string) => Response.json(
    { success: false, message: `User role '${role}' is not authorized to access this route` },
    { status: 403 }
  ),
};
