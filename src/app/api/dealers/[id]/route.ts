import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET - Fetch single dealer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { id } = await params;

    const { data: dealer, error } = await supabaseAdmin
      .from('dealers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !dealer) {
      return Response.json({ error: 'Dealer not found' }, { status: 404 });
    }

    return Response.json({
      id: dealer.id,
      Dealer_ID: `DLR${String(dealer.id).padStart(4, '0')}`,
      Company_Name: dealer.company_name || '',
      Business_Type: dealer.business_type || 'Dealer',
      GST_Number: dealer.gst_number || '',
      PAN_Number: dealer.pan_number || '',
      Establishment_Year: dealer.establishment_year || '',
      Status: dealer.status || 'active',
      Country: dealer.country || '',
      State: dealer.state || '',
      City: dealer.city || '',
      Address: dealer.address || '',
      PIN_Code: dealer.pin_code || '',
      Territory_Covered: dealer.territory_covered || '',
      Phone: dealer.phone || '',
      Mobile: dealer.mobile || '',
      Email: dealer.email || '',
      Website: dealer.website || '',
      Contact_Person_Name: dealer.contact_person_name || '',
      Contact_Person_Designation: dealer.contact_person_designation || '',
      Contact_Person_Phone: dealer.contact_person_phone || '',
      Contact_Person_Email: dealer.contact_person_email || '',
      Products_Dealing: dealer.products_dealing || '',
      productsOffered: dealer.products_offered || [],
      Brands_Handled: dealer.brands_handled || '',
      Annual_Turnover: dealer.annual_turnover || '',
      Employee_Count: dealer.employee_count || '',
      Warehouse_Area: dealer.warehouse_area || '',
      Fleet_Size: dealer.fleet_size || '',
      Credit_Limit: dealer.credit_limit || '',
      Bank_Name: dealer.bank_name || '',
      Bank_Account_Number: dealer.bank_account_number || '',
      Bank_IFSC: dealer.bank_ifsc || '',
      Payment_Terms: dealer.payment_terms || '',
      Rating: dealer.rating || 0,
      Agreement_Start_Date: dealer.agreement_start_date || '',
      Agreement_End_Date: dealer.agreement_end_date || '',
    });
  } catch (error) {
    console.error('Error in GET /api/dealers/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update dealer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.companyName?.trim()) {
      return Response.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Check if dealer exists
    const { data: existingDealer, error: fetchError } = await supabaseAdmin
      .from('dealers')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingDealer) {
      return Response.json({ error: 'Dealer not found' }, { status: 404 });
    }

    // Convert productsOffered to products_dealing string for backward compatibility
    const productsDealingStr = body.productsOffered?.filter((p: { productType: string }) => p.productType)
      .map((p: { productType: string }) => p.productType).join(', ') || '';

    const { data: updatedDealer, error } = await supabaseAdmin
      .from('dealers')
      .update({
        company_name: body.companyName,
        business_type: body.businessType || 'Dealer',
        gst_number: body.gstNumber || '',
        pan_number: body.panNumber || '',
        establishment_year: body.establishmentYear || '',
        status: body.status || 'active',
        country: body.country || '',
        state: body.state || '',
        city: body.city || '',
        address: body.address || '',
        pin_code: body.pinCode || '',
        territory_covered: body.territoryCovered || '',
        phone: body.phone || '',
        mobile: body.mobile || '',
        email: body.email || '',
        website: body.website || '',
        contact_person_name: body.contactPersonName || '',
        contact_person_designation: body.contactPersonDesignation || '',
        contact_person_phone: body.contactPersonPhone || '',
        contact_person_email: body.contactPersonEmail || '',
        products_dealing: productsDealingStr || '',
        products_offered: body.productsOffered || [],
        brands_handled: body.brandsHandled || '',
        annual_turnover: body.annualTurnover || '',
        employee_count: body.employeeCount || '',
        warehouse_area: body.warehouseArea || '',
        fleet_size: body.fleetSize || '',
        credit_limit: body.creditLimit || '',
        bank_name: body.bankName || '',
        bank_account_number: body.bankAccountNumber || '',
        bank_ifsc: body.bankIFSC || '',
        payment_terms: body.paymentTerms || '',
        rating: body.rating || 0,
        agreement_start_date: body.agreementStartDate || null,
        agreement_end_date: body.agreementEndDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dealer:', error);
      return Response.json({ error: 'Failed to update dealer' }, { status: 500 });
    }

    return Response.json({
      id: updatedDealer.id,
      Dealer_ID: `DLR${String(updatedDealer.id).padStart(4, '0')}`,
      Company_Name: updatedDealer.company_name,
      Business_Type: updatedDealer.business_type,
      Status: updatedDealer.status,
    });
  } catch (error) {
    console.error('Error in PUT /api/dealers/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete dealer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    // Only admin can delete
    if (user.role !== 'admin') {
      return authErrors.forbidden(user.role);
    }

    const { id } = await params;

    // Check if dealer exists
    const { data: existingDealer, error: fetchError } = await supabaseAdmin
      .from('dealers')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingDealer) {
      return Response.json({ error: 'Dealer not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('dealers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting dealer:', error);
      return Response.json({ error: 'Failed to delete dealer' }, { status: 500 });
    }

    return Response.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/dealers/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
