import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET /api/products/check-schema - Check if products table has required columns
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    // Try to get a sample product with all expected columns
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, subtypes, unit, specifications')
      .limit(1);

    if (error) {
      // If there's an error mentioning column doesn't exist, report it
      if (error.message.includes('column') || error.message.includes('does not exist')) {
        return Response.json({
          success: false,
          message: 'Missing columns in products table',
          error: error.message,
          fix: 'Run this SQL in Supabase: ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT, ADD COLUMN IF NOT EXISTS specifications TEXT;'
        });
      }
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }

    // Check what columns are actually present
    const sampleProduct = products?.[0];
    const hasUnitColumn = sampleProduct !== undefined && 'unit' in (sampleProduct || {});
    const hasSpecsColumn = sampleProduct !== undefined && 'specifications' in (sampleProduct || {});

    return Response.json({
      success: true,
      message: 'Schema check complete',
      columns: {
        unit: hasUnitColumn ? 'exists' : 'may be missing or null',
        specifications: hasSpecsColumn ? 'exists' : 'may be missing or null'
      },
      sampleData: sampleProduct || 'No products in database',
      note: 'If unit/specifications show as null even after adding products, ensure the columns exist in the database'
    });
  } catch (error) {
    console.error('Schema check error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to check schema' },
      { status: 500 }
    );
  }
}

// POST /api/products/check-schema - Returns instructions for adding missing columns
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }
    if (user.role !== 'admin') {
      return authErrors.forbidden('admin');
    }

    // Return instructions for manual column addition
    return Response.json({
      success: false,
      message: 'Please add the columns manually via Supabase dashboard or SQL editor.',
      sql: `ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'm',
ADD COLUMN IF NOT EXISTS specifications TEXT DEFAULT '';`,
      manualFix: 'Go to Supabase Dashboard > Table Editor > products > Add columns: unit (text) and specifications (text)'
    });
  } catch (error) {
    console.error('Schema update error:', error);
    return Response.json({
      success: false,
      message: 'Could not process request. Please add columns manually via Supabase dashboard.',
      manualFix: 'Go to Supabase Dashboard > Table Editor > products > Add columns: unit (text) and specifications (text)'
    });
  }
}
