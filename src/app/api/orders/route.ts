import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';
import { fuzzyMatch, validateName, validateLocation, validateNumeric } from '@/lib/utils';

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }

    const transformedOrders = (orders || []).map(order => ({
      ...order,
      createdAt: order.created_at,
      _id: order.id,
      id: order.id
    }));

    return Response.json(transformedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { manufacturer, product, productType, quantity, fromLocation, toLocation, transportCost, productCost, totalCost } = await request.json();

    if (!manufacturer || !product || !productType || !quantity || !fromLocation || !toLocation || totalCost === undefined) {
      return Response.json(
        { success: false, message: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Validations
    const manufacturerValidation = validateName(manufacturer, 'Manufacturer', 160);
    if (!manufacturerValidation.valid) {
      return Response.json({ success: false, message: manufacturerValidation.message }, { status: 400 });
    }

    const productValidation = validateName(product, 'Product', 160);
    if (!productValidation.valid) {
      return Response.json({ success: false, message: productValidation.message }, { status: 400 });
    }

    const productTypeValidation = validateName(productType, 'Product type', 160);
    if (!productTypeValidation.valid) {
      return Response.json({ success: false, message: productTypeValidation.message }, { status: 400 });
    }

    const quantityValidation = validateNumeric(quantity, 'Quantity', false, 0.01);
    if (!quantityValidation.valid) {
      return Response.json({ success: false, message: quantityValidation.message }, { status: 400 });
    }

    const fromLocationValidation = validateLocation(fromLocation);
    if (!fromLocationValidation.valid) {
      return Response.json({ success: false, message: 'From location: ' + fromLocationValidation.message }, { status: 400 });
    }

    const toLocationValidation = validateLocation(toLocation);
    if (!toLocationValidation.valid) {
      return Response.json({ success: false, message: 'To location: ' + toLocationValidation.message }, { status: 400 });
    }

    if (fromLocation.toLowerCase() === toLocation.toLowerCase()) {
      return Response.json(
        { success: false, message: 'From location and To location cannot be the same' },
        { status: 400 }
      );
    }

    const totalCostValidation = validateNumeric(totalCost, 'Total cost', true, 0);
    if (!totalCostValidation.valid) {
      return Response.json({ success: false, message: totalCostValidation.message }, { status: 400 });
    }

    // Check for duplicates
    const { data: allOrders } = await supabaseAdmin.from('orders').select('*');

    for (const existingOrder of (allOrders || [])) {
      const manufacturerScore = fuzzyMatch(manufacturer, existingOrder.manufacturer);
      const productScore = fuzzyMatch(product, existingOrder.product);
      const productTypeScore = fuzzyMatch(productType, existingOrder.product_type);
      const fromLocationScore = fuzzyMatch(fromLocation, existingOrder.from_location);
      const toLocationScore = fuzzyMatch(toLocation, existingOrder.to_location);
      const quantityMatch = Math.abs(parseFloat(quantity) - parseFloat(existingOrder.quantity)) < 0.01;
      
      if (manufacturerScore >= 0.85 && 
          productScore >= 0.85 && 
          productTypeScore >= 0.85 && 
          quantityMatch && 
          fromLocationScore >= 0.85 && 
          toLocationScore >= 0.85) {
        return Response.json({
          success: false,
          message: 'Duplicate entry detected',
          existing: {
            manufacturer: existingOrder.manufacturer,
            product: existingOrder.product,
            productType: existingOrder.product_type,
            quantity: existingOrder.quantity,
            fromLocation: existingOrder.from_location,
            toLocation: existingOrder.to_location,
            totalCost: existingOrder.total_cost,
            createdAt: existingOrder.created_at
          }
        }, { status: 409 });
      }
    }

    const { data: order, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        manufacturer,
        product,
        product_type: productType,
        quantity,
        from_location: fromLocation,
        to_location: toLocation,
        transport_cost: transportCost || 0,
        product_cost: productCost || 0,
        total_cost: totalCost
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ success: false, message: insertError.message }, { status: 500 });
    }

    const transformedOrder = {
      ...order,
      productType: order.product_type,
      fromLocation: order.from_location,
      toLocation: order.to_location,
      transportCost: order.transport_cost,
      productCost: order.product_cost,
      totalCost: order.total_cost,
      createdAt: order.created_at,
      _id: order.id,
      id: order.id
    };

    return Response.json({ success: true, data: transformedOrder }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders?id=xxx - Delete order
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('id', id)
      .single();

    if (!order) {
      return Response.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return Response.json({ success: false, message: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to delete order' },
      { status: 500 }
    );
  }
}
