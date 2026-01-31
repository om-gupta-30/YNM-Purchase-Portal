import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';
import { fuzzyMatch, validateName, validateUnit } from '@/lib/utils';

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Products fetch error:', error);
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }
    
    // Log the raw data to help debug
    if (products && products.length > 0) {
      console.log('First product raw data:', JSON.stringify(products[0]));
    }

    // Transform to frontend format - expand subtypes into separate entries
    const transformedProducts: Array<{
      _id: number;
      id: number;
      Product_ID: string;
      Product_Name: string;
      Sub_Type: string;
      Unit: string;
      Specifications: string;
    }> = [];
    
    (products || []).forEach((product: Record<string, unknown>) => {
      // Get unit and specifications with fallbacks for different column name formats
      const productUnit = (product.unit || product.Unit || product.UNIT || 'm') as string;
      const productSpecs = (product.specifications || product.Specifications || product.SPECIFICATIONS || product.specs || '') as string;
      const productName = (product.name || product.Name || product.product_name || product.Product_Name || '') as string;
      const productSubtypes = (product.subtypes || product.Subtypes || product.sub_types || []) as string[];
      
      const productId = product.id as number;
      
      if (productSubtypes && productSubtypes.length > 0) {
        productSubtypes.forEach((subtype: string) => {
          transformedProducts.push({
            _id: productId,
            id: productId,
            Product_ID: `P${String(productId).padStart(3, '0')}`,
            Product_Name: productName,
            Sub_Type: subtype,
            Unit: productUnit,
            Specifications: productSpecs
          });
        });
      } else {
        transformedProducts.push({
          _id: productId,
          id: productId,
          Product_ID: `P${String(productId).padStart(3, '0')}`,
          Product_Name: productName,
          Sub_Type: productName,
          Unit: productUnit,
          Specifications: productSpecs
        });
      }
    });

    return Response.json(transformedProducts);
  } catch (error) {
    console.error('Get products error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const body = await request.json();
    
    // Support both frontend format and backend format
    let finalName: string, finalSubtypes: string[], finalUnit: string, finalSpecifications: string;
    
    if (body.Product_Name) {
      finalName = body.Product_Name;
      finalSubtypes = body.Sub_Type ? [body.Sub_Type] : [];
      finalUnit = body.Unit;
      finalSpecifications = body.Specifications || '';
    } else {
      finalName = body.name;
      finalSubtypes = body.subtypes || [];
      finalUnit = body.unit;
      finalSpecifications = body.specifications || '';
    }

    if (!finalName || !finalUnit) {
      return Response.json(
        { success: false, message: 'Please provide name/Product_Name and unit/Unit' },
        { status: 400 }
      );
    }

    // Validate specifications is provided (required field)
    if (!finalSpecifications || finalSpecifications.trim() === '') {
      return Response.json(
        { success: false, message: 'Specifications is required. Please provide product specifications.' },
        { status: 400 }
      );
    }

    // Validations
    const nameValidation = validateName(finalName, 'Product name', 160);
    if (!nameValidation.valid) {
      return Response.json({ success: false, message: nameValidation.message }, { status: 400 });
    }

    const unitValidation = validateUnit(finalUnit);
    if (!unitValidation.valid) {
      return Response.json({ success: false, message: unitValidation.message }, { status: 400 });
    }

    if (!finalSubtypes || !Array.isArray(finalSubtypes) || finalSubtypes.length === 0) {
      return Response.json(
        { success: false, message: 'At least one product type (subtype) must be provided' },
        { status: 400 }
      );
    }

    // Check for duplicates
    const { data: allProducts } = await supabaseAdmin.from('products').select('*');

    for (const existingProduct of (allProducts || [])) {
      const nameScore = fuzzyMatch(finalName, existingProduct.name);
      
      if (nameScore >= 0.85) {
        if (finalSubtypes.length > 0 && existingProduct.subtypes?.length > 0) {
          for (const newSubtype of finalSubtypes) {
            for (const existingSubtype of existingProduct.subtypes) {
              const subtypeScore = fuzzyMatch(newSubtype, existingSubtype);
              if (subtypeScore >= 0.85) {
                return Response.json({
                  success: false,
                  message: 'Duplicate entry detected',
                  existing: {
                    name: existingProduct.name,
                    subtype: existingSubtype,
                    unit: existingProduct.unit
                  }
                }, { status: 409 });
              }
            }
          }
        } else if (nameScore >= 0.95) {
          return Response.json({
            success: false,
            message: 'Duplicate entry detected',
            existing: {
              name: existingProduct.name,
              subtypes: existingProduct.subtypes,
              unit: existingProduct.unit
            }
          }, { status: 409 });
        }
      }
    }

    const { data: product, error: insertError } = await supabaseAdmin
      .from('products')
      .insert({
        name: finalName,
        subtypes: finalSubtypes,
        unit: finalUnit,
        specifications: finalSpecifications
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ success: false, message: insertError.message }, { status: 500 });
    }

    const response = {
      _id: product.id,
      id: product.id,
      Product_ID: `P${String(product.id).slice(-3)}`,
      Product_Name: product.name,
      Sub_Type: product.subtypes?.[0] || product.name,
      Unit: product.unit,
      Specifications: product.specifications || ''
    };

    return Response.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products?id=xxx - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .single();

    if (!product) {
      return Response.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return Response.json({ success: false, message: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    );
  }
}

// PUT /api/products?id=xxx - Update product
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    // Support both frontend format and backend format
    let finalName: string, finalSubtypes: string[], finalUnit: string, finalSpecifications: string;
    
    if (body.Product_Name) {
      finalName = body.Product_Name;
      finalSubtypes = body.Sub_Type ? [body.Sub_Type] : [];
      finalUnit = body.Unit;
      finalSpecifications = body.Specifications || '';
    } else {
      finalName = body.name;
      finalSubtypes = body.subtypes || [];
      finalUnit = body.unit;
      finalSpecifications = body.specifications || '';
    }

    if (!finalName || !finalUnit) {
      return Response.json(
        { success: false, message: 'Please provide name/Product_Name and unit/Unit' },
        { status: 400 }
      );
    }

    // Validate specifications is provided (required field)
    if (!finalSpecifications || finalSpecifications.trim() === '') {
      return Response.json(
        { success: false, message: 'Specifications is required. Please provide product specifications.' },
        { status: 400 }
      );
    }

    // Validations
    const nameValidation = validateName(finalName, 'Product name', 160);
    if (!nameValidation.valid) {
      return Response.json({ success: false, message: nameValidation.message }, { status: 400 });
    }

    const unitValidation = validateUnit(finalUnit);
    if (!unitValidation.valid) {
      return Response.json({ success: false, message: unitValidation.message }, { status: 400 });
    }

    // Check if product exists
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingProduct) {
      return Response.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    // Update product
    const { data: product, error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        name: finalName,
        subtypes: finalSubtypes.length > 0 ? finalSubtypes : existingProduct.subtypes,
        unit: finalUnit,
        specifications: finalSpecifications
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return Response.json({ success: false, message: updateError.message }, { status: 500 });
    }

    const response = {
      _id: product.id,
      id: product.id,
      Product_ID: `P${String(product.id).slice(-3)}`,
      Product_Name: product.name,
      Sub_Type: product.subtypes?.[0] || product.name,
      Unit: product.unit,
      Specifications: product.specifications || ''
    };

    return Response.json({ success: true, data: response });
  } catch (error) {
    console.error('Update product error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}
