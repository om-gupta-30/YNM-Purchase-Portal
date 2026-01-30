import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET single customer
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
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    return Response.json({
      id: customer.id,
      Customer_ID: customer.customer_id,
      Company_Name: customer.company_name,
      Contact_Person: customer.contact_person,
      Designation: customer.designation,
      Phone: customer.phone,
      Mobile: customer.mobile,
      Email: customer.email,
      Website: customer.website,
      Address: customer.address,
      City: customer.city,
      State: customer.state,
      Country: customer.country,
      PIN_Code: customer.pin_code,
      GST_Number: customer.gst_number,
      PAN_Number: customer.pan_number,
      Payment_Terms: customer.payment_terms,
      Credit_Limit: customer.credit_limit,
      Status: customer.status,
      Notes: customer.notes,
      created_at: customer.created_at
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update customer
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
    const {
      companyName,
      contactPerson,
      designation,
      phone,
      mobile,
      email,
      website,
      address,
      city,
      state,
      country,
      pinCode,
      gstNumber,
      panNumber,
      paymentTerms,
      creditLimit,
      status,
      notes
    } = body;

    const { data: updatedCustomer, error } = await supabaseAdmin
      .from('customers')
      .update({
        company_name: companyName,
        contact_person: contactPerson,
        designation: designation,
        phone: phone,
        mobile: mobile,
        email: email,
        website: website,
        address: address,
        city: city,
        state: state,
        country: country,
        pin_code: pinCode,
        gst_number: gstNumber,
        pan_number: panNumber,
        payment_terms: paymentTerms,
        credit_limit: creditLimit,
        status: status,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return Response.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    return Response.json({
      id: updatedCustomer.id,
      Customer_ID: updatedCustomer.customer_id,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE customer (admin only)
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
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      return Response.json({ error: 'Failed to delete customer' }, { status: 500 });
    }

    return Response.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
