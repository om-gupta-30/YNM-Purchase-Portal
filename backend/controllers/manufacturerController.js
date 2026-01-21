const { supabase } = require('../config/supabase');
const { validatePhone, validateName, validateLocation, validateNumeric, validateUnit } = require('../middleware/validation');

// Helper function for fuzzy matching
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fuzzyMatch(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    
    let distance = 0;
    const minLen = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLen; i++) {
        if (s1[i] !== s2[i]) distance++;
    }
    distance += Math.abs(s1.length - s2.length);
    
    const similarity = 1 - (distance / maxLen);
    return distance <= 2 && maxLen > 2 ? Math.max(similarity, 0.85) : similarity;
}

// @desc    Get all manufacturers
// @route   GET /api/manufacturers
// @access  Private
exports.getManufacturers = async (req, res) => {
  try {
    const { data: manufacturers, error } = await supabase
      .from('manufacturers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    
    // Transform to frontend format
    const transformedManufacturers = (manufacturers || []).map(manufacturer => {
      const productsOffered = (manufacturer.products_offered || []).map(p => p.productType).join(', ');
      const productPrices = (manufacturer.products_offered || []).map(p => `${p.productType}: ${p.price}`).join(', ');
      
      return {
        _id: manufacturer.id,
        id: manufacturer.id,
        Manufacturer_ID: `M${String(manufacturer.id).padStart(3, '0')}`,
        Manufacturer_Name: manufacturer.name,
        Location: manufacturer.location,
        Contact_Number: manufacturer.contact,
        Products_Offered: productsOffered,
        'Product_Prices (Rs.)': productPrices,
        productsOffered: manufacturer.products_offered || []
      };
    });
    
    res.status(200).json(transformedManufacturers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create manufacturer
// @route   POST /api/manufacturers
// @access  Private/Admin
exports.createManufacturer = async (req, res) => {
  try {
    // Support both frontend format and backend format
    let name, location, contact, productsOffered;
    
    if (req.body.Manufacturer_Name) {
      // Frontend format - parse Products_Offered and Product_Prices
      name = req.body.Manufacturer_Name;
      location = req.body.Location;
      contact = req.body.Contact_Number;
      
      // Parse products offered and prices
      const productsStr = req.body.Products_Offered || '';
      const pricesStr = req.body['Product_Prices (Rs.)'] || '';
      
      const productTypes = productsStr.split(',').map(p => p.trim()).filter(p => p);
      const priceMap = {};
      
      // Parse prices string like "W-Beam: 420, Thrie-Beam: 460"
      if (pricesStr) {
        pricesStr.split(',').forEach(item => {
          const match = item.trim().match(/(.+?):\s*(\d+)/);
          if (match) {
            priceMap[match[1].trim()] = parseInt(match[2]);
          }
        });
      }
      
      productsOffered = productTypes.map(type => ({
        productType: type,
        price: priceMap[type] || 0
      }));
    } else {
      // Backend format
      name = req.body.name;
      location = req.body.location;
      contact = req.body.contact;
      productsOffered = req.body.productsOffered || [];
    }

    // Validate required fields
    if (!name || !location || !contact) {
      return res.status(400).json({ success: false, message: 'Please provide name/Manufacturer_Name, location/Location, and contact/Contact_Number' });
    }

    // Validate name
    const nameValidation = validateName(name, 'Manufacturer name', 160);
    if (!nameValidation.valid) {
      return res.status(400).json({ success: false, message: nameValidation.message });
    }

    // Validate location
    const locationValidation = validateLocation(location);
    if (!locationValidation.valid) {
      return res.status(400).json({ success: false, message: locationValidation.message });
    }

    // Validate phone
    const phoneValidation = validatePhone(contact);
    if (!phoneValidation.valid) {
      return res.status(400).json({ success: false, message: phoneValidation.message });
    }

    // Validate productsOffered
    if (!Array.isArray(productsOffered) || productsOffered.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product must be provided' });
    }

    // Validate each product - MUST exist in Products database
    for (const product of productsOffered) {
      if (!product.productType || !product.price) {
        return res.status(400).json({ success: false, message: 'Each product must have productType and price' });
      }

      const productTypeValidation = validateName(product.productType, 'Product type', 160);
      if (!productTypeValidation.valid) {
        return res.status(400).json({ success: false, message: productTypeValidation.message });
      }

      const priceValidation = validateNumeric(product.price, 'Product price', false, 0.01);
      if (!priceValidation.valid) {
        return res.status(400).json({ success: false, message: priceValidation.message });
      }

      // CRITICAL: Verify product exists in Products database
      const { data: allProducts } = await supabase
        .from('products')
        .select('*');

      let productFound = false;
      let productName = null;

      // Check if productType matches any product's subtype
      for (const dbProduct of (allProducts || [])) {
        if (dbProduct.subtypes && dbProduct.subtypes.includes(product.productType)) {
          productFound = true;
          productName = dbProduct.name;
          break;
        }
      }

      if (!productFound) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid product. Product type "${product.productType}" does not exist in the Products database. Please add this product in the Products page first.` 
        });
      }
    }

    // Check for duplicate manufacturers
    const { data: allManufacturers } = await supabase
      .from('manufacturers')
      .select('*');

    for (const existingManufacturer of (allManufacturers || [])) {
      const nameScore = fuzzyMatch(name, existingManufacturer.name);
      
      if (nameScore >= 0.85) {
        // Check if same product + productType combination exists
        const existingProducts = existingManufacturer.products_offered || [];
        for (const newProduct of productsOffered) {
          for (const existingProduct of existingProducts) {
            const productTypeScore = fuzzyMatch(newProduct.productType, existingProduct.productType);
            if (productTypeScore >= 0.85) {
              return res.status(409).json({
                success: false,
                message: 'Duplicate entry detected',
                existing: {
                  name: existingManufacturer.name,
                  location: existingManufacturer.location,
                  productType: existingProduct.productType,
                  price: existingProduct.price
                }
              });
            }
          }
        }
        
        if (nameScore >= 0.95) {
          // Very high name match
          return res.status(409).json({
            success: false,
            message: 'Duplicate entry detected',
            existing: {
              name: existingManufacturer.name,
              location: existingManufacturer.location,
              contact: existingManufacturer.contact
            }
          });
        }
      }
    }

    const { data: manufacturer, error: insertError } = await supabase
      .from('manufacturers')
      .insert({
        name,
        location,
        contact,
        products_offered: productsOffered
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ success: false, message: insertError.message });
    }

    // Return in frontend format
    const productsOfferedStr = (manufacturer.products_offered || []).map(p => p.productType).join(', ');
    const productPricesStr = (manufacturer.products_offered || []).map(p => `${p.productType}: ${p.price}`).join(', ');
    
    const response = {
      _id: manufacturer.id,
      id: manufacturer.id,
      Manufacturer_ID: `M${String(manufacturer.id).slice(-3)}`,
      Manufacturer_Name: manufacturer.name,
      Location: manufacturer.location,
      Contact_Number: manufacturer.contact,
      Products_Offered: productsOfferedStr,
      'Product_Prices (Rs.)': productPricesStr,
      productsOffered: manufacturer.products_offered || []
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update manufacturer
// @route   PUT /api/manufacturers/:id
// @access  Private/Admin
exports.updateManufacturer = async (req, res) => {
  try {
    // Convert productsOffered to products_offered if needed
    const updateData = { ...req.body };
    if (updateData.productsOffered) {
      updateData.products_offered = updateData.productsOffered;
      delete updateData.productsOffered;
    }

    const { data: manufacturer, error: updateError } = await supabase
      .from('manufacturers')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }

    // Return in frontend format
    const productsOfferedStr = (manufacturer.products_offered || []).map(p => p.productType).join(', ');
    const productPricesStr = (manufacturer.products_offered || []).map(p => `${p.productType}: ${p.price}`).join(', ');
    
    const response = {
      _id: manufacturer.id,
      id: manufacturer.id,
      Manufacturer_ID: `M${String(manufacturer.id).slice(-3)}`,
      Manufacturer_Name: manufacturer.name,
      Location: manufacturer.location,
      Contact_Number: manufacturer.contact,
      Products_Offered: productsOfferedStr,
      'Product_Prices (Rs.)': productPricesStr,
      productsOffered: manufacturer.products_offered || []
    };

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete manufacturer
// @route   DELETE /api/manufacturers/:id
// @access  Private/Admin
exports.deleteManufacturer = async (req, res) => {
  try {
    // Check if manufacturer exists
    const { data: manufacturer } = await supabase
      .from('manufacturers')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!manufacturer) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found' });
    }

    // Delete manufacturer
    const { error: deleteError } = await supabase
      .from('manufacturers')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      return res.status(500).json({ success: false, message: deleteError.message });
    }

    res.status(200).json({ success: true, message: 'Manufacturer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
