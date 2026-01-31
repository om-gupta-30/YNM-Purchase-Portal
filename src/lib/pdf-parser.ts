import * as pdfParse from 'pdf-parse';

interface PdfExtractResult {
  success: boolean;
  manufacturer: string;
  product: string;
  type: string;
  quantity: string;
  from: string;
  to: string;
  error?: string;
}

function normalizeText(text: string): string {
  if (!text) return '';
  
  // Replace newlines with spaces
  let normalized = text.replace(/\n/g, ' ').replace(/\r/g, ' ');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Normalize punctuation
  normalized = normalized.replace(/[:;]\s*/g, ': ');
  normalized = normalized.replace(/[-–—]\s*/g, '-');
  
  return normalized.trim();
}

function extractManufacturer(text: string): string | null {
  const patterns = [
    /Manufacturer[: ]+(.+)/i,
    /Mfr[: ]+(.+)/i,
    /Vendor[: ]+(.+)/i,
    /Supplier[: ]+(.+)/i,
    /Party\s+Name[: ]+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      let manufacturer = matches[1];
      manufacturer = manufacturer.replace(/^[\s:.-]+|[\s:.-]+$/g, '');
      manufacturer = manufacturer.replace(/\s+/g, ' ').trim();
      manufacturer = manufacturer.replace(/\s+(product|quantity|price|from|to|$)/i, '');
      if (manufacturer.length > 2) {
        return manufacturer;
      }
    }
  }
  
  return null;
}

function extractProduct(text: string, normalizedText: string): string | null {
  // Direct keyword detection
  const keywords: Record<string, string[]> = {
    'W Beam Crash Barrier': ['w beam', 'w-beam', 'wbeam', 'crash barrier'],
    'Thrie Beam': ['thrie beam', 'thrie-beam'],
    'Double W Beam': ['double w beam', 'double w-beam'],
    'Crash-Tested': ['crash tested', 'crash-tested'],
    'Hot Thermoplastic Paint': ['hot thermoplastic paint', 'thermoplastic paint', 'hot paint'],
    'Signages': ['signages', 'signage', 'signs']
  };
  
  const normalizedLower = normalizedText.toLowerCase();
  for (const [productName, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (normalizedLower.includes(keyword)) {
        return productName;
      }
    }
  }
  
  // Regex patterns
  const patterns = [
    /Product[: ]+(.+)/i,
    /Item[: ]+(.+)/i,
    /Material[: ]+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      let product = matches[1];
      product = product.replace(/^[\s:.-]+|[\s:.-]+$/g, '');
      product = product.replace(/\s+/g, ' ').trim();
      product = product.replace(/\s+(type|quantity|price|from|to|$)/i, '');
      if (product.length > 2) {
        return product;
      }
    }
  }
  
  return null;
}

function extractSubtype(text: string, normalizedText: string): string | null {
  // Direct subtype keywords
  const subtypeKeywords: Record<string, string[]> = {
    'W-Beam': ['w-beam', 'w beam'],
    'Thrie-Beam': ['thrie-beam', 'thrie beam'],
    'Double W-Beam': ['double w-beam', 'double w beam'],
    'Crash-Tested': ['crash-tested', 'crash tested'],
    'White': ['white'],
    'Yellow': ['yellow'],
    'Reflective': ['reflective'],
    'Directional': ['directional'],
    'Informational': ['informational'],
    'Cautionary': ['cautionary']
  };
  
  const normalizedLower = normalizedText.toLowerCase();
  for (const [subtypeName, keywordList] of Object.entries(subtypeKeywords)) {
    for (const keyword of keywordList) {
      if (normalizedLower.includes(keyword)) {
        return subtypeName;
      }
    }
  }
  
  // Regex patterns
  const patterns = [
    /Type[: ]+(.+)/i,
    /Product\s+Type[: ]+(.+)/i,
    /Subtype[: ]+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      let subtype = matches[1];
      subtype = subtype.replace(/^[\s:.-]+|[\s:.-]+$/g, '');
      subtype = subtype.replace(/\s+/g, ' ').trim();
      subtype = subtype.replace(/\s+(quantity|price|from|to|$)/i, '');
      if (subtype.length > 1) {
        return subtype;
      }
    }
  }
  
  return null;
}

function extractQuantity(text: string): string | null {
  const patterns = [
    /Quantity[: ]+([0-9]+)/i,
    /Qty[: ]+([0-9]+)/i,
    /Ordered[: ]+([0-9]+)/i,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      const qtyMatch = matches[1].match(/(\d+)/);
      if (qtyMatch) {
        return qtyMatch[1];
      }
    }
  }
  
  return null;
}

function extractFromLocation(text: string): string | null {
  const patterns = [
    /From[: ]+(.+)/i,
    /Origin[: ]+(.+)/i,
    /Shipped\s+From[: ]+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      let location = matches[1];
      location = location.replace(/^[\s:.-]+|[\s:.-]+$/g, '');
      location = location.replace(/\s+/g, ' ').trim();
      location = location.replace(/\s+(to|destination|delivery|transport|$)/i, '');
      if (location.length > 2) {
        return location;
      }
    }
  }
  
  return null;
}

function extractToLocation(text: string): string | null {
  const patterns = [
    /To[: ]+(.+)/i,
    /Deliver\s+To[: ]+(.+)/i,
    /Destination[: ]+(.+)/i,
    /Ship\s+To[: ]+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches[1]) {
      let location = matches[1];
      location = location.replace(/^[\s:.-]+|[\s:.-]+$/g, '');
      location = location.replace(/\s+/g, ' ').trim();
      location = location.replace(/\s+(transport|rate|distance|estimated|$)/i, '');
      if (location.length > 2) {
        return location;
      }
    }
  }
  
  return null;
}

export async function extractPdfData(buffer: Buffer): Promise<PdfExtractResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = (pdfParse as any).default || pdfParse;
    const data = await pdf(buffer);
    const rawText = data.text;
    
    if (!rawText || rawText.trim().length === 0) {
      return {
        success: false,
        manufacturer: '',
        product: '',
        type: '',
        quantity: '',
        from: '',
        to: '',
        error: 'Could not extract text from PDF. The PDF may be image-based or corrupted.'
      };
    }
    
    const normalizedText = normalizeText(rawText);
    
    return {
      success: true,
      manufacturer: extractManufacturer(rawText) || '',
      product: extractProduct(rawText, normalizedText) || '',
      type: extractSubtype(rawText, normalizedText) || '',
      quantity: extractQuantity(rawText) || '',
      from: extractFromLocation(rawText) || '',
      to: extractToLocation(rawText) || ''
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      success: false,
      manufacturer: '',
      product: '',
      type: '',
      quantity: '',
      from: '',
      to: '',
      error: error instanceof Error ? error.message : 'Error processing PDF'
    };
  }
}
