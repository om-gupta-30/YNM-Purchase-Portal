import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET - Fetch all dealers
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { data: dealers, error } = await supabaseAdmin
      .from('dealers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dealers:', error);
      return Response.json({ error: 'Failed to fetch dealers' }, { status: 500 });
    }

    // Transform data to match frontend expectations
    const transformedDealers = dealers?.map((dealer) => ({
      id: dealer.id,
      Dealer_ID: `DLR${String(dealer.id).padStart(4, '0')}`,
      // Company Information
      Company_Name: dealer.company_name || '',
      Business_Type: dealer.business_type || 'Dealer',
      GST_Number: dealer.gst_number || '',
      PAN_Number: dealer.pan_number || '',
      Establishment_Year: dealer.establishment_year || '',
      Status: dealer.status || 'active',
      // Location Details
      Country: dealer.country || '',
      State: dealer.state || '',
      City: dealer.city || '',
      Address: dealer.address || '',
      PIN_Code: dealer.pin_code || '',
      Territory_Covered: dealer.territory_covered || '',
      // Contact Information
      Phone: dealer.phone || '',
      Mobile: dealer.mobile || '',
      Email: dealer.email || '',
      Website: dealer.website || '',
      // Contact Person
      Contact_Person_Name: dealer.contact_person_name || '',
      Contact_Person_Designation: dealer.contact_person_designation || '',
      Contact_Person_Phone: dealer.contact_person_phone || '',
      Contact_Person_Email: dealer.contact_person_email || '',
      // Business Details
      Products_Dealing: dealer.products_dealing || '',
      productsOffered: dealer.products_offered || [],
      Brands_Handled: dealer.brands_handled || '',
      Annual_Turnover: dealer.annual_turnover || '',
      Employee_Count: dealer.employee_count || '',
      Warehouse_Area: dealer.warehouse_area || '',
      Fleet_Size: dealer.fleet_size || '',
      Credit_Limit: dealer.credit_limit || '',
      // Bank Details
      Bank_Name: dealer.bank_name || '',
      Bank_Account_Number: dealer.bank_account_number || '',
      Bank_IFSC: dealer.bank_ifsc || '',
      Payment_Terms: dealer.payment_terms || '',
      // Rating & Agreement
      Rating: dealer.rating || 0,
      Agreement_Start_Date: dealer.agreement_start_date || '',
      Agreement_End_Date: dealer.agreement_end_date || '',
    })) || [];

    return Response.json(transformedDealers);
  } catch (error) {
    console.error('Error in GET /api/dealers:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new dealer
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.companyName?.trim()) {
      return Response.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Convert productsOffered to products_dealing string for backward compatibility
    const productsDealingStr = body.productsOffered?.filter((p: { productType: string }) => p.productType)
      .map((p: { productType: string }) => p.productType).join(', ') || '';

    const { data: newDealer, error } = await supabaseAdmin
      .from('dealers')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dealer:', error);
      return Response.json({ error: 'Failed to create dealer' }, { status: 500 });
    }

    return Response.json({
      id: newDealer.id,
      Dealer_ID: `DLR${String(newDealer.id).padStart(4, '0')}`,
      Company_Name: newDealer.company_name,
      Business_Type: newDealer.business_type,
      Status: newDealer.status,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/dealers:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
