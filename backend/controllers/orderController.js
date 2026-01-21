const { supabase } = require('../config/supabase');
const { validateName, validateLocation, validateNumeric } = require('../middleware/validation');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

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

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Transform to match frontend expectations (convert created_at to createdAt)
    const transformedOrders = (orders || []).map(order => ({
      ...order,
      createdAt: order.created_at,
      _id: order.id,
      id: order.id
    }));

    res.status(200).json(transformedOrders);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { manufacturer, product, productType, quantity, fromLocation, toLocation, transportCost, productCost, totalCost } = req.body;

    if (!manufacturer || !product || !productType || !quantity || !fromLocation || !toLocation || totalCost === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Validate manufacturer name
    const manufacturerValidation = validateName(manufacturer, 'Manufacturer', 160);
    if (!manufacturerValidation.valid) {
      return res.status(400).json({ success: false, message: manufacturerValidation.message });
    }

    // Validate product name
    const productValidation = validateName(product, 'Product', 160);
    if (!productValidation.valid) {
      return res.status(400).json({ success: false, message: productValidation.message });
    }

    // Validate product type
    const productTypeValidation = validateName(productType, 'Product type', 160);
    if (!productTypeValidation.valid) {
      return res.status(400).json({ success: false, message: productTypeValidation.message });
    }

    // Validate quantity
    const quantityValidation = validateNumeric(quantity, 'Quantity', false, 0.01);
    if (!quantityValidation.valid) {
      return res.status(400).json({ success: false, message: quantityValidation.message });
    }

    // Validate from location
    const fromLocationValidation = validateLocation(fromLocation);
    if (!fromLocationValidation.valid) {
      return res.status(400).json({ success: false, message: 'From location: ' + fromLocationValidation.message });
    }

    // Validate to location
    const toLocationValidation = validateLocation(toLocation);
    if (!toLocationValidation.valid) {
      return res.status(400).json({ success: false, message: 'To location: ' + toLocationValidation.message });
    }

    // Check if locations are different
    if (fromLocation.toLowerCase() === toLocation.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'From location and To location cannot be the same' });
    }

    // Validate costs
    if (transportCost !== undefined) {
      const transportCostValidation = validateNumeric(transportCost, 'Transport cost', true, 0);
      if (!transportCostValidation.valid) {
        return res.status(400).json({ success: false, message: transportCostValidation.message });
      }
    }

    if (productCost !== undefined) {
      const productCostValidation = validateNumeric(productCost, 'Product cost', true, 0);
      if (!productCostValidation.valid) {
        return res.status(400).json({ success: false, message: productCostValidation.message });
      }
    }

    const totalCostValidation = validateNumeric(totalCost, 'Total cost', true, 0);
    if (!totalCostValidation.valid) {
      return res.status(400).json({ success: false, message: totalCostValidation.message });
    }

    // Check for duplicate orders
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*');

    for (const existingOrder of (allOrders || [])) {
      const manufacturerScore = fuzzyMatch(manufacturer, existingOrder.manufacturer);
      const productScore = fuzzyMatch(product, existingOrder.product);
      const productTypeScore = fuzzyMatch(productType, existingOrder.product_type);
      const fromLocationScore = fuzzyMatch(fromLocation, existingOrder.from_location);
      const toLocationScore = fuzzyMatch(toLocation, existingOrder.to_location);
      const quantityMatch = Math.abs(parseFloat(quantity) - parseFloat(existingOrder.quantity)) < 0.01;
      
      if (manufacturerScore >= 0.85 && 
          productScore >= 0.85 && 
          productTypeScore >= 0.85 && 
          quantityMatch && 
          fromLocationScore >= 0.85 && 
          toLocationScore >= 0.85) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry detected',
          existing: {
            manufacturer: existingOrder.manufacturer,
            product: existingOrder.product,
            productType: existingOrder.product_type,
            quantity: existingOrder.quantity,
            fromLocation: existingOrder.from_location,
            toLocation: existingOrder.to_location,
            totalCost: existingOrder.total_cost,
            createdAt: existingOrder.created_at
          }
        });
      }
    }

    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        manufacturer,
        product,
        product_type: productType,
        quantity,
        from_location: fromLocation,
        to_location: toLocation,
        transport_cost: transportCost || 0,
        product_cost: productCost || 0,
        total_cost: totalCost
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ success: false, message: insertError.message });
    }

    // Transform response to match frontend expectations
    const transformedOrder = {
      ...order,
      productType: order.product_type,
      fromLocation: order.from_location,
      toLocation: order.to_location,
      transportCost: order.transport_cost,
      productCost: order.product_cost,
      totalCost: order.total_cost,
      createdAt: order.created_at,
      _id: order.id,
      id: order.id
    };

    res.status(201).json({ success: true, data: transformedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    // Check if order exists
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Delete order
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      return res.status(500).json({ success: false, message: deleteError.message });
    }

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Extract PDF data
// @route   POST /api/orders/extract-pdf
// @access  Private
exports.extractPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file provided' });
    }

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
    const pdfServiceUrl = `${pythonServiceUrl}/extract`;
    
    // Create FormData to forward PDF to Python service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    // Optionally send manufacturer list
    if (req.body.manufacturer_list) {
      formData.append('manufacturer_list', req.body.manufacturer_list);
    }

    try {
      // Forward PDF to Python service
      // Use formData.getHeaders() which sets Content-Type with boundary
      const response = await axios.post(pdfServiceUrl, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Return Python service response directly
      return res.status(200).json(response.data);
    } catch (pythonError) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (pythonError.response) {
        return res.status(500).json({
          success: false,
          message: pythonError.response.data?.error || 'PDF extraction failed'
        });
      }

      // Check if PDF is unreadable
      if (pythonError.message && pythonError.message.includes('extract text')) {
        return res.status(500).json({
          success: false,
          message: 'Cannot read PDF. The PDF may be image-based or corrupted.'
        });
      }

      return res.status(500).json({
        success: false,
        message: pythonError.message || 'Error processing PDF'
      });
    }
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Error processing PDF'
    });
  }
};
