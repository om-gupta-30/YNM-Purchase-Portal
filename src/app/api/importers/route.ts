import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET /api/importers - Get all importers
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { data: importers, error } = await supabaseAdmin
      .from('importers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }

    // Transform to frontend format
    const transformedImporters = (importers || []).map(importer => ({
      id: importer.id,
      Importer_ID: `IMP${String(importer.id).padStart(3, '0')}`,
      Company_Name: importer.company_name,
      Country: importer.country,
      City: importer.city || '',
      Address: importer.address || '',
      Phone: importer.phone || '',
      Email: importer.email || '',
      Website: importer.website || '',
      IEC_Code: importer.iec_code || '',
      Business_Type: importer.business_type || '',
      Products_Imported: importer.products_imported || '',
      productsOffered: importer.products_offered || [],
      Countries_Importing_From: importer.countries_importing_from || '',
      Contact_Person_Name: importer.contact_person_name || '',
      Contact_Person_Phone: importer.contact_person_phone || '',
      Contact_Person_Email: importer.contact_person_email || '',
      Contact_Person_Designation: importer.contact_person_designation || '',
      Bank_Name: importer.bank_name || '',
      Bank_Account_Number: importer.bank_account_number || '',
      Bank_IFSC: importer.bank_ifsc || '',
      Payment_Terms: importer.payment_terms || '',
      Rating: importer.rating || 0,
      Status: importer.status || 'active',
      created_at: importer.created_at
    }));

    return Response.json(transformedImporters);
  } catch (error) {
    console.error('Get importers error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get importers' },
      { status: 500 }
    );
  }
}

// POST /api/importers - Create importer
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const body = await request.json();
    
    const {
      companyName,
      country,
      city,
      address,
      phone,
      email,
      website,
      iecCode,
      businessType,
      productsOffered,
      countriesImportingFrom,
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail,
      contactPersonDesignation,
      bankName,
      bankAccountNumber,
      bankIFSC,
      paymentTerms,
      rating,
      status
    } = body;

    // Validations
    if (!companyName || !country) {
      return Response.json(
        { success: false, message: 'Please provide company name and country' },
        { status: 400 }
      );
    }

    // Convert productsOffered to products_imported string for backward compatibility
    const productsImportedStr = productsOffered?.filter((p: { productType: string }) => p.productType)
      .map((p: { productType: string }) => p.productType).join(', ') || '';

    const { data: importer, error } = await supabaseAdmin
      .from('importers')
      .insert({
        company_name: companyName,
        country,
        city: city || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        iec_code: iecCode || null,
        business_type: businessType || null,
        products_imported: productsImportedStr || null,
        products_offered: productsOffered || [],
        countries_importing_from: countriesImportingFrom || null,
        contact_person_name: contactPersonName || null,
        contact_person_phone: contactPersonPhone || null,
        contact_person_email: contactPersonEmail || null,
        contact_person_designation: contactPersonDesignation || null,
        bank_name: bankName || null,
        bank_account_number: bankAccountNumber || null,
        bank_ifsc: bankIFSC || null,
        payment_terms: paymentTerms || null,
        rating: rating || 0,
        status: status || 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }

    const transformedImporter = {
      id: importer.id,
      Importer_ID: `IMP${String(importer.id).padStart(3, '0')}`,
      Company_Name: importer.company_name,
      Country: importer.country,
      City: importer.city || '',
      Address: importer.address || '',
      Phone: importer.phone || '',
      Email: importer.email || '',
      Website: importer.website || '',
      IEC_Code: importer.iec_code || '',
      Business_Type: importer.business_type || '',
      Products_Imported: importer.products_imported || '',
      productsOffered: importer.products_offered || [],
      Countries_Importing_From: importer.countries_importing_from || '',
      Contact_Person_Name: importer.contact_person_name || '',
      Contact_Person_Phone: importer.contact_person_phone || '',
      Contact_Person_Email: importer.contact_person_email || '',
      Contact_Person_Designation: importer.contact_person_designation || '',
      Bank_Name: importer.bank_name || '',
      Bank_Account_Number: importer.bank_account_number || '',
      Bank_IFSC: importer.bank_ifsc || '',
      Payment_Terms: importer.payment_terms || '',
      Rating: importer.rating || 0,
      Status: importer.status || 'active',
      created_at: importer.created_at
    };

    return Response.json(transformedImporter, { status: 201 });
  } catch (error) {
    console.error('Create importer error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to create importer' },
      { status: 500 }
    );
  }
}
