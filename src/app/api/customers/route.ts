import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET all customers
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return authErrors.unauthorized();
  }

  try {
    const { data: customers, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return Response.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Transform to frontend format
    const transformedCustomers = customers?.map(customer => ({
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
    })) || [];

    return Response.json(transformedCustomers);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new customer
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return authErrors.unauthorized();
  }

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

    // Generate Customer ID
    const { data: lastCustomer } = await supabaseAdmin
      .from('customers')
      .select('customer_id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastCustomer?.customer_id) {
      const match = lastCustomer.customer_id.match(/CUST-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const customerId = `CUST-${String(nextNumber).padStart(5, '0')}`;

    const { data: newCustomer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        customer_id: customerId,
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
        country: country || 'India',
        pin_code: pinCode,
        gst_number: gstNumber,
        pan_number: panNumber,
        payment_terms: paymentTerms,
        credit_limit: creditLimit,
        status: status || 'active',
        notes: notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return Response.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    return Response.json({
      id: newCustomer.id,
      Customer_ID: newCustomer.customer_id,
      Company_Name: newCustomer.company_name,
      message: 'Customer created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
