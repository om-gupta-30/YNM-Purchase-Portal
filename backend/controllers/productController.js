const { supabase } = require('../config/supabase');
const { validateName, validateUnit } = require('../middleware/validation');

// Helper function for fuzzy matching (simplified Levenshtein)
function normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fuzzyMatch(str1, str2) {
    const s1 = normalizeText(str1);
    const s2 = normalizeText(str2);
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Simple Levenshtein distance calculation
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

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
    
    // Transform to frontend format - expand subtypes into separate entries
    const transformedProducts = [];
    (products || []).forEach(product => {
      if (product.subtypes && product.subtypes.length > 0) {
        // Create one entry per subtype
        product.subtypes.forEach(subtype => {
          transformedProducts.push({
            _id: product.id,
            id: product.id,
            Product_ID: `P${String(product.id).padStart(3, '0')}`,
            Product_Name: product.name,
            Sub_Type: subtype,
            Unit: product.unit,
            Notes: product.notes || ''
          });
        });
      } else {
        // No subtypes, create single entry
        transformedProducts.push({
          _id: product.id,
          id: product.id,
          Product_ID: `P${String(product.id).slice(-3)}`,
          Product_Name: product.name,
          Sub_Type: product.name,
          Unit: product.unit,
          Notes: product.notes || ''
        });
      }
    });
    
    res.status(200).json(transformedProducts);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    // Support both frontend format (Product_Name, Sub_Type) and backend format (name, subtypes)
    let finalName, finalSubtypes, finalUnit, finalNotes;
    
    if (req.body.Product_Name) {
      // Frontend format
      finalName = req.body.Product_Name;
      finalSubtypes = req.body.Sub_Type ? [req.body.Sub_Type] : [];
      finalUnit = req.body.Unit;
      finalNotes = req.body.Notes || '';
    } else {
      // Backend format
      finalName = req.body.name;
      finalSubtypes = req.body.subtypes || [];
      finalUnit = req.body.unit;
      finalNotes = req.body.notes || '';
    }

    if (!finalName || !finalUnit) {
      return res.status(400).json({ success: false, message: 'Please provide name/Product_Name and unit/Unit' });
    }

    // Validate name
    const nameValidation = validateName(finalName, 'Product name', 160);
    if (!nameValidation.valid) {
      return res.status(400).json({ success: false, message: nameValidation.message });
    }

    // Validate unit
    const unitValidation = validateUnit(finalUnit);
    if (!unitValidation.valid) {
      return res.status(400).json({ success: false, message: unitValidation.message });
    }

    // Validate subtypes
    if (!finalSubtypes || !Array.isArray(finalSubtypes) || finalSubtypes.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product type (subtype) must be provided' });
    }

    for (const subtype of finalSubtypes) {
      const subtypeValidation = validateName(subtype, 'Product type', 160);
      if (!subtypeValidation.valid) {
        return res.status(400).json({ success: false, message: subtypeValidation.message });
      }
    }

    // Validate notes if provided
    if (finalNotes && finalNotes.length > 200) {
      return res.status(400).json({ success: false, message: 'Notes must be 200 characters or less' });
    }

    if (finalNotes && !/^[A-Za-z0-9\s\-\(\)\.,]+$/.test(finalNotes)) {
      return res.status(400).json({ success: false, message: 'Notes can only contain letters, numbers, spaces, and limited punctuation' });
    }

    // Check for duplicate products
    const { data: allProducts } = await supabase
      .from('products')
      .select('*');

    for (const existingProduct of (allProducts || [])) {
      const nameScore = fuzzyMatch(finalName, existingProduct.name);
      
      if (nameScore >= 0.85) {
        // Check if subtypes match
        if (finalSubtypes && finalSubtypes.length > 0 && existingProduct.subtypes && existingProduct.subtypes.length > 0) {
          for (const newSubtype of finalSubtypes) {
            for (const existingSubtype of existingProduct.subtypes) {
              const subtypeScore = fuzzyMatch(newSubtype, existingSubtype);
              if (subtypeScore >= 0.85) {
                return res.status(409).json({
                  success: false,
                  message: 'Duplicate entry detected',
                  existing: {
                    name: existingProduct.name,
                    subtype: existingSubtype,
                    unit: existingProduct.unit
                  }
                });
              }
            }
          }
        } else if (nameScore >= 0.95) {
          // Very high name match
          return res.status(409).json({
            success: false,
            message: 'Duplicate entry detected',
            existing: {
              name: existingProduct.name,
              subtypes: existingProduct.subtypes,
              unit: existingProduct.unit
            }
          });
        }
      }
    }

    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        name: finalName,
        subtypes: finalSubtypes,
        unit: finalUnit,
        notes: finalNotes
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ success: false, message: insertError.message });
    }

    // Return in frontend format
    const response = {
      _id: product.id,
      id: product.id,
      Product_ID: `P${String(product.id).slice(-3)}`,
      Product_Name: product.name,
      Sub_Type: product.subtypes && product.subtypes.length > 0 ? product.subtypes[0] : product.name,
      Unit: product.unit,
      Notes: product.notes || ''
    };

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    // Check if product exists
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      return res.status(500).json({ success: false, message: deleteError.message });
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
