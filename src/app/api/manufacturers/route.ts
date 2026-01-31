import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getUserFromRequest, authErrors } from '@/lib/auth';
import { fuzzyMatch, validateName, validatePhone, validateLocation, validateNumeric } from '@/lib/utils';

interface ProductOffered {
  productType?: string;
  product_type?: string;
  price: number;
}

// GET /api/manufacturers - Get all manufacturers
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { data: manufacturers, error } = await supabaseAdmin
      .from('manufacturers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Manufacturers fetch error:', error);
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }

    // Log first manufacturer to help debug
    if (manufacturers && manufacturers.length > 0) {
      console.log('First manufacturer raw data:', JSON.stringify(manufacturers[0]));
    }

    // Transform to frontend format - handle both old and new column names
    const transformedManufacturers = (manufacturers || []).map(manufacturer => {
      // Get products_offered with fallbacks for different formats
      const productsData = manufacturer.products_offered || manufacturer.productsOffered || [];
      const productsOffered = Array.isArray(productsData) 
        ? productsData.map((p: ProductOffered) => p.productType || p.product_type || '').filter(Boolean).join(', ')
        : '';
      const productPrices = Array.isArray(productsData)
        ? productsData.map((p: ProductOffered) => `${p.productType || p.product_type}: ${p.price}`).filter(Boolean).join(', ')
        : '';
      
      return {
        _id: manufacturer.id,
        id: manufacturer.id,
        Manufacturer_ID: `M${String(manufacturer.id).padStart(3, '0')}`,
        Manufacturer_Name: manufacturer.name || manufacturer.Name || '',
        Location: manufacturer.location || manufacturer.Location || '',
        Contact_Number: manufacturer.contact || manufacturer.Contact || manufacturer.phone || '',
        Email: manufacturer.email || manufacturer.Email || '',
        Contact_Person_Name: manufacturer.contact_person_name || manufacturer.contactPersonName || '',
        Contact_Person_Phone: manufacturer.contact_person_phone || manufacturer.contactPersonPhone || '',
        Contact_Person_Email: manufacturer.contact_person_email || manufacturer.contactPersonEmail || '',
        Contact_Person_Designation: manufacturer.contact_person_designation || manufacturer.contactPersonDesignation || '',
        GST_Number: manufacturer.gst_number || manufacturer.gstNumber || manufacturer.GST_Number || '',
        Website: manufacturer.website || manufacturer.Website || '',
        Products_Offered: productsOffered,
        'Product_Prices (Rs.)': productPrices,
        productsOffered: productsData
      };
    });

    return Response.json(transformedManufacturers);
  } catch (error) {
    console.error('Get manufacturers error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get manufacturers' },
      { status: 500 }
    );
  }
}

// POST /api/manufacturers - Create manufacturer
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const body = await request.json();
    
    let name: string, location: string, contact: string, productsOffered: ProductOffered[];
    let email = '', contactPersonName = '', contactPersonPhone = '', contactPersonEmail = '';
    let contactPersonDesignation = '', gstNumber = '', website = '';
    
    if (body.Manufacturer_Name) {
      // Frontend format
      name = body.Manufacturer_Name;
      location = body.Location;
      contact = body.Contact_Number;
      email = body.Email || '';
      contactPersonName = body.Contact_Person_Name || '';
      contactPersonPhone = body.Contact_Person_Phone || '';
      contactPersonEmail = body.Contact_Person_Email || '';
      contactPersonDesignation = body.Contact_Person_Designation || '';
      gstNumber = body.GST_Number || '';
      website = body.Website || '';
      
      const productsStr = body.Products_Offered || '';
      const pricesStr = body['Product_Prices (Rs.)'] || '';
      
      const productTypes = productsStr.split(',').map((p: string) => p.trim()).filter((p: string) => p);
      const priceMap: Record<string, number> = {};
      
      if (pricesStr) {
        pricesStr.split(',').forEach((item: string) => {
          const match = item.trim().match(/(.+?):\s*(\d+)/);
          if (match) {
            priceMap[match[1].trim()] = parseInt(match[2]);
          }
        });
      }
      
      productsOffered = productTypes.map((type: string) => ({
        productType: type,
        price: priceMap[type] || 0
      }));
    } else {
      name = body.name;
      location = body.location;
      contact = body.contact;
      email = body.email || '';
      contactPersonName = body.contactPersonName || '';
      contactPersonPhone = body.contactPersonPhone || '';
      contactPersonEmail = body.contactPersonEmail || '';
      contactPersonDesignation = body.contactPersonDesignation || '';
      gstNumber = body.gstNumber || '';
      website = body.website || '';
      productsOffered = body.productsOffered || [];
    }

    // Validations
    if (!name || !location || !contact) {
      return Response.json(
        { success: false, message: 'Please provide name, location, and contact' },
        { status: 400 }
      );
    }

    const nameValidation = validateName(name, 'Manufacturer name', 160);
    if (!nameValidation.valid) {
      return Response.json({ success: false, message: nameValidation.message }, { status: 400 });
    }

    const locationValidation = validateLocation(location);
    if (!locationValidation.valid) {
      return Response.json({ success: false, message: locationValidation.message }, { status: 400 });
    }

    const phoneValidation = validatePhone(contact);
    if (!phoneValidation.valid) {
      return Response.json({ success: false, message: phoneValidation.message }, { status: 400 });
    }

    if (!Array.isArray(productsOffered) || productsOffered.length === 0) {
      return Response.json(
        { success: false, message: 'At least one product must be provided' },
        { status: 400 }
      );
    }

    // Validate products exist
    const { data: allProducts } = await supabaseAdmin.from('products').select('*');

    for (const product of productsOffered) {
      if (!product.productType || !product.price) {
        return Response.json(
          { success: false, message: 'Each product must have productType and price' },
          { status: 400 }
        );
      }

      const priceValidation = validateNumeric(product.price, 'Product price', false, 0.01);
      if (!priceValidation.valid) {
        return Response.json({ success: false, message: priceValidation.message }, { status: 400 });
      }

      let productFound = false;
      for (const dbProduct of (allProducts || [])) {
        if (dbProduct.subtypes?.includes(product.productType)) {
          productFound = true;
          break;
        }
      }

      if (!productFound) {
        return Response.json({
          success: false,
          message: `Invalid product. Product type "${product.productType}" does not exist in the Products database.`
        }, { status: 400 });
      }
    }

    // Check for duplicates
    const { data: allManufacturers } = await supabaseAdmin.from('manufacturers').select('*');

    for (const existingManufacturer of (allManufacturers || [])) {
      const nameScore = fuzzyMatch(name, existingManufacturer.name);
      
      if (nameScore >= 0.85) {
        const existingProducts = existingManufacturer.products_offered || [];
        for (const newProduct of productsOffered) {
          const newProductType = newProduct.productType || newProduct.product_type || '';
          for (const existingProduct of existingProducts) {
            const existingProductType = existingProduct.productType || existingProduct.product_type || '';
            const productTypeScore = fuzzyMatch(newProductType, existingProductType);
            if (productTypeScore >= 0.85) {
              return Response.json({
                success: false,
                message: 'Duplicate entry detected',
                existing: {
                  name: existingManufacturer.name,
                  location: existingManufacturer.location,
                  productType: existingProductType,
                  price: existingProduct.price
                }
              }, { status: 409 });
            }
          }
        }
      }
    }

    const { data: manufacturer, error: insertError } = await supabaseAdmin
      .from('manufacturers')
      .insert({
        name,
        location,
        contact,
        email,
        contact_person_name: contactPersonName,
        contact_person_phone: contactPersonPhone,
        contact_person_email: contactPersonEmail,
        contact_person_designation: contactPersonDesignation,
        gst_number: gstNumber,
        website,
        products_offered: productsOffered
      })
      .select()
      .single();

    if (insertError) {
      return Response.json({ success: false, message: insertError.message }, { status: 500 });
    }

    const productsOfferedStr = (manufacturer.products_offered || []).map((p: ProductOffered) => p.productType).join(', ');
    const productPricesStr = (manufacturer.products_offered || []).map((p: ProductOffered) => `${p.productType}: ${p.price}`).join(', ');

    const response = {
      _id: manufacturer.id,
      id: manufacturer.id,
      Manufacturer_ID: `M${String(manufacturer.id).slice(-3)}`,
      Manufacturer_Name: manufacturer.name,
      Location: manufacturer.location,
      Contact_Number: manufacturer.contact,
      Email: manufacturer.email || '',
      Contact_Person_Name: manufacturer.contact_person_name || '',
      Contact_Person_Phone: manufacturer.contact_person_phone || '',
      Contact_Person_Email: manufacturer.contact_person_email || '',
      Contact_Person_Designation: manufacturer.contact_person_designation || '',
      GST_Number: manufacturer.gst_number || '',
      Website: manufacturer.website || '',
      Products_Offered: productsOfferedStr,
      'Product_Prices (Rs.)': productPricesStr,
      productsOffered: manufacturer.products_offered || []
    };

    return Response.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    console.error('Create manufacturer error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to create manufacturer' },
      { status: 500 }
    );
  }
}

// DELETE /api/manufacturers?id=xxx - Delete manufacturer
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: 'Manufacturer ID is required' }, { status: 400 });
    }

    const { data: manufacturer } = await supabaseAdmin
      .from('manufacturers')
      .select('id')
      .eq('id', id)
      .single();

    if (!manufacturer) {
      return Response.json({ success: false, message: 'Manufacturer not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('manufacturers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return Response.json({ success: false, message: deleteError.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Manufacturer deleted successfully' });
  } catch (error) {
    console.error('Delete manufacturer error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to delete manufacturer' },
      { status: 500 }
    );
  }
}

// PUT /api/manufacturers?id=xxx - Update manufacturer
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return authErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: 'Manufacturer ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    const { 
      name, location, contact, productsOffered,
      email, contactPersonName, contactPersonPhone, contactPersonEmail,
      contactPersonDesignation, gstNumber, website 
    } = body;

    // Validations
    if (!name || !location || !contact) {
      return Response.json(
        { success: false, message: 'Please provide name, location, and contact' },
        { status: 400 }
      );
    }

    const nameValidation = validateName(name, 'Manufacturer name', 160);
    if (!nameValidation.valid) {
      return Response.json({ success: false, message: nameValidation.message }, { status: 400 });
    }

    const locationValidation = validateLocation(location);
    if (!locationValidation.valid) {
      return Response.json({ success: false, message: locationValidation.message }, { status: 400 });
    }

    const phoneValidation = validatePhone(contact);
    if (!phoneValidation.valid) {
      return Response.json({ success: false, message: phoneValidation.message }, { status: 400 });
    }

    // Check if manufacturer exists
    const { data: existingManufacturer } = await supabaseAdmin
      .from('manufacturers')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingManufacturer) {
      return Response.json({ success: false, message: 'Manufacturer not found' }, { status: 404 });
    }

    // Validate products if provided
    if (productsOffered && Array.isArray(productsOffered) && productsOffered.length > 0) {
      const { data: allProducts } = await supabaseAdmin.from('products').select('*');

      for (const product of productsOffered) {
        if (!product.productType || !product.price) {
          return Response.json(
            { success: false, message: 'Each product must have productType and price' },
            { status: 400 }
          );
        }

        const priceValidation = validateNumeric(product.price, 'Product price', false, 0.01);
        if (!priceValidation.valid) {
          return Response.json({ success: false, message: priceValidation.message }, { status: 400 });
        }

        let productFound = false;
        for (const dbProduct of (allProducts || [])) {
          if (dbProduct.subtypes?.includes(product.productType)) {
            productFound = true;
            break;
          }
        }

        if (!productFound) {
          return Response.json({
            success: false,
            message: `Invalid product. Product type "${product.productType}" does not exist in the Products database.`
          }, { status: 400 });
        }
      }
    }

    // Update manufacturer
    const { data: manufacturer, error: updateError } = await supabaseAdmin
      .from('manufacturers')
      .update({
        name,
        location,
        contact,
        email: email || existingManufacturer.email,
        contact_person_name: contactPersonName || existingManufacturer.contact_person_name,
        contact_person_phone: contactPersonPhone || existingManufacturer.contact_person_phone,
        contact_person_email: contactPersonEmail || existingManufacturer.contact_person_email,
        contact_person_designation: contactPersonDesignation || existingManufacturer.contact_person_designation,
        gst_number: gstNumber || existingManufacturer.gst_number,
        website: website || existingManufacturer.website,
        products_offered: productsOffered || existingManufacturer.products_offered
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return Response.json({ success: false, message: updateError.message }, { status: 500 });
    }

    const productsOfferedStr = (manufacturer.products_offered || []).map((p: ProductOffered) => p.productType).join(', ');
    const productPricesStr = (manufacturer.products_offered || []).map((p: ProductOffered) => `${p.productType}: ${p.price}`).join(', ');

    const response = {
      _id: manufacturer.id,
      id: manufacturer.id,
      Manufacturer_ID: `M${String(manufacturer.id).slice(-3)}`,
      Manufacturer_Name: manufacturer.name,
      Location: manufacturer.location,
      Contact_Number: manufacturer.contact,
      Email: manufacturer.email || '',
      Contact_Person_Name: manufacturer.contact_person_name || '',
      Contact_Person_Phone: manufacturer.contact_person_phone || '',
      Contact_Person_Email: manufacturer.contact_person_email || '',
      Contact_Person_Designation: manufacturer.contact_person_designation || '',
      GST_Number: manufacturer.gst_number || '',
      Website: manufacturer.website || '',
      Products_Offered: productsOfferedStr,
      'Product_Prices (Rs.)': productPricesStr,
      productsOffered: manufacturer.products_offered || []
    };

    return Response.json({ success: true, data: response });
  } catch (error) {
    console.error('Update manufacturer error:', error);
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to update manufacturer' },
      { status: 500 }
    );
  }
}
