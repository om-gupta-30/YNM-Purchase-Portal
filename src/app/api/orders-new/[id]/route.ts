import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return authErrors.unauthorized();
  }

  const { id } = await params;

  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders_new')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json(order);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update order (status, dispatch details, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return authErrors.unauthorized();
  }

  const { id } = await params;

  try {
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    // Status update
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // PO shared checkbox
    if (body.poSharedWithVendor !== undefined) {
      updateData.po_shared_with_vendor = body.poSharedWithVendor;
    }

    // Dispatch details (when status is dispatched)
    if (body.dispatchDate !== undefined) updateData.dispatch_date = body.dispatchDate;
    if (body.sentThrough !== undefined) updateData.sent_through = body.sentThrough;
    if (body.transporterName !== undefined) updateData.transporter_name = body.transporterName;
    if (body.lorryNumber !== undefined) updateData.lorry_number = body.lorryNumber;
    if (body.vehicleNumber !== undefined) updateData.vehicle_number = body.vehicleNumber;
    if (body.driverName !== undefined) updateData.driver_name = body.driverName;
    if (body.driverPhone !== undefined) updateData.driver_phone = body.driverPhone;
    if (body.lrDocketNumber !== undefined) updateData.lr_docket_number = body.lrDocketNumber;
    if (body.ewayBillNumber !== undefined) updateData.eway_bill_number = body.ewayBillNumber;
    if (body.invoiceNumber !== undefined) updateData.invoice_number = body.invoiceNumber;
    if (body.numPackages !== undefined) updateData.num_packages = body.numPackages;
    if (body.totalWeight !== undefined) updateData.total_weight = body.totalWeight;
    if (body.freightCharges !== undefined) updateData.freight_charges = body.freightCharges;
    if (body.freightPaidBy !== undefined) updateData.freight_paid_by = body.freightPaidBy;
    if (body.dispatchNotes !== undefined) updateData.dispatch_notes = body.dispatchNotes;

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders_new')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return Response.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return Response.json({
      id: updatedOrder.id,
      order_id: updatedOrder.order_id,
      status: updatedOrder.status,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE order (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return authErrors.unauthorized();
  }

  if (user.role !== 'admin') {
    return authErrors.forbidden(user.role);
  }

  const { id } = await params;

  try {
    const { error } = await supabaseAdmin
      .from('orders_new')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      return Response.json({ error: 'Failed to delete order' }, { status: 500 });
    }

    return Response.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
