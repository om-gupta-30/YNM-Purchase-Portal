// Validation utility functions for form fields

export const validators = {
  // Phone number - exactly 10 digits
  phone: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' }; // Optional field
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      return { valid: false, message: 'Phone number must be exactly 10 digits' };
    }
    return { valid: true, message: '' };
  },

  // Phone with country code - 10-15 digits
  phoneWithCode: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      return { valid: false, message: 'Phone number must be 10-15 digits' };
    }
    return { valid: true, message: '' };
  },

  // Email validation
  email: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true, message: '' };
  },

  // PIN code - exactly 6 digits (India)
  pincode: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      return { valid: false, message: 'PIN code must be exactly 6 digits' };
    }
    return { valid: true, message: '' };
  },

  // ZIP code - 5-10 characters (international)
  zipcode: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    if (value.length < 5 || value.length > 10) {
      return { valid: false, message: 'ZIP/PIN code must be 5-10 characters' };
    }
    return { valid: true, message: '' };
  },

  // GST Number - 15 characters alphanumeric
  gst: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(value.toUpperCase())) {
      return { valid: false, message: 'Invalid GST format (e.g., 22AAAAA0000A1Z5)' };
    }
    return { valid: true, message: '' };
  },

  // PAN Number - 10 characters
  pan: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(value.toUpperCase())) {
      return { valid: false, message: 'Invalid PAN format (e.g., ABCDE1234F)' };
    }
    return { valid: true, message: '' };
  },

  // IFSC Code - 11 characters
  ifsc: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(value.toUpperCase())) {
      return { valid: false, message: 'Invalid IFSC format (e.g., HDFC0001234)' };
    }
    return { valid: true, message: '' };
  },

  // Bank Account Number - 9-18 digits
  bankAccount: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 9 || cleaned.length > 18) {
      return { valid: false, message: 'Account number must be 9-18 digits' };
    }
    return { valid: true, message: '' };
  },

  // IEC Code (Import Export Code) - 10 characters
  iec: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const iecRegex = /^[A-Z]{3}[A-Z0-9]{7}$/;
    if (value.length !== 10) {
      return { valid: false, message: 'IEC code must be exactly 10 characters' };
    }
    if (!iecRegex.test(value.toUpperCase())) {
      return { valid: false, message: 'Invalid IEC format (e.g., AABCT1234A)' };
    }
    return { valid: true, message: '' };
  },

  // Website URL
  website: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    try {
      // Add protocol if missing for validation
      const urlToTest = value.startsWith('http') ? value : `https://${value}`;
      new URL(urlToTest);
      return { valid: true, message: '' };
    } catch {
      return { valid: false, message: 'Please enter a valid website URL' };
    }
  },

  // Required field
  required: (value: string, fieldName: string = 'This field'): { valid: boolean; message: string } => {
    if (!value || !value.trim()) {
      return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true, message: '' };
  },

  // Year validation (4 digits, reasonable range)
  year: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const year = parseInt(value);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear) {
      return { valid: false, message: `Year must be between 1900 and ${currentYear}` };
    }
    return { valid: true, message: '' };
  },

  // Positive number
  positiveNumber: (value: number | string): { valid: boolean; message: string } => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num < 0) {
      return { valid: false, message: 'Please enter a valid positive number' };
    }
    return { valid: true, message: '' };
  },

  // E-way Bill Number - 12 digits
  ewayBill: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 12) {
      return { valid: false, message: 'E-way bill must be exactly 12 digits' };
    }
    return { valid: true, message: '' };
  },

  // Vehicle Number (Indian format)
  vehicleNumber: (value: string): { valid: boolean; message: string } => {
    if (!value) return { valid: true, message: '' };
    const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
    if (!vehicleRegex.test(value.toUpperCase().replace(/\s/g, ''))) {
      return { valid: false, message: 'Invalid vehicle number format (e.g., MH12AB1234)' };
    }
    return { valid: true, message: '' };
  },
};

// Helper function to validate multiple fields
export const validateForm = (
  data: Record<string, unknown>,
  rules: Record<string, (value: unknown) => { valid: boolean; message: string }>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    if (!result.valid) {
      errors[field] = result.message;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Format phone number as user types
export const formatPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned;
  }
  return cleaned.slice(0, 10);
};

// Format GST as user types (uppercase)
export const formatGST = (value: string): string => {
  return value.toUpperCase().slice(0, 15);
};

// Format PAN as user types (uppercase)
export const formatPAN = (value: string): string => {
  return value.toUpperCase().slice(0, 10);
};

// Format IFSC as user types (uppercase)
export const formatIFSC = (value: string): string => {
  return value.toUpperCase().slice(0, 11);
};

// Format PIN code
export const formatPincode = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 6);
};

// Format bank account number
export const formatBankAccount = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 18);
};
