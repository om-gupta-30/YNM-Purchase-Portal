import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET all orders
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return authErrors.unauthorized();
  }

  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders_new')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return Response.json(orders || []);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new order
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return authErrors.unauthorized();
  }

  try {
    const body = await request.json();

    // Generate Order ID
    const { data: lastOrder } = await supabaseAdmin
      .from('orders_new')
      .select('order_id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastOrder?.order_id) {
      const match = lastOrder.order_id.match(/ORD-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const orderId = `ORD-${String(nextNumber).padStart(5, '0')}`;

    // Generate Customer PO if for supply
    let customerPoNumber = null;
    if (body.orderPurpose === 'supply' && body.customerId) {
      const { data: lastPo } = await supabaseAdmin
        .from('orders_new')
        .select('customer_po_number')
        .not('customer_po_number', 'is', null)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      let poNumber = 1;
      if (lastPo?.customer_po_number) {
        const match = lastPo.customer_po_number.match(/PO-(\d+)/);
        if (match) {
          poNumber = parseInt(match[1]) + 1;
        }
      }
      customerPoNumber = `PO-${String(poNumber).padStart(5, '0')}`;
    }

    const { data: newOrder, error } = await supabaseAdmin
      .from('orders_new')
      .insert({
        order_id: orderId,
        vendor_type: body.vendorType,
        vendor_id: body.vendorId,
        vendor_name: body.vendorName,
        order_type: body.orderType,
        product_type: body.productType,
        quantity: body.quantity,
        unit: body.unit,
        unit_price: body.unitPrice,
        total_amount: body.totalAmount,
        special_instructions: body.specialInstructions,
        order_purpose: body.orderPurpose,
        consumption_location: body.consumptionLocation,
        customer_id: body.customerId,
        customer_po_number: customerPoNumber,
        customer_email: body.customerEmail,
        date_of_issue: body.dateOfIssue || new Date().toISOString().split('T')[0],
        tentative_dispatch_date: body.tentativeDispatchDate,
        status: 'pending',
        po_shared_with_vendor: false,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return Response.json({ error: 'Failed to create order' }, { status: 500 });
    }

    return Response.json({
      id: newOrder.id,
      order_id: newOrder.order_id,
      customer_po_number: newOrder.customer_po_number,
      message: 'Order created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
