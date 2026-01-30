import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';

// GET /api/importers/[id] - Get single importer
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

    const { data: importer, error } = await supabaseAdmin
      .from('importers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return Response.json({ success: false, message: 'Importer not found' }, { status: 404 });
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

    return Response.json(transformedImporter);
  } catch (error) {
    console.error('Get importer error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get importer' },
      { status: 500 }
    );
  }
}

// PUT /api/importers/[id] - Update importer
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
      .update({
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
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
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

    return Response.json(transformedImporter);
  } catch (error) {
    console.error('Update importer error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to update importer' },
      { status: 500 }
    );
  }
}

// DELETE /api/importers/[id] - Delete importer
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
      return Response.json(
        { success: false, message: 'Only admin can delete importers' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('importers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Importer deleted successfully' });
  } catch (error) {
    console.error('Delete importer error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to delete importer' },
      { status: 500 }
    );
  }
}
