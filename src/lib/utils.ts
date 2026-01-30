// Helper function for fuzzy matching (simplified Levenshtein)
export function normalizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function fuzzyMatch(str1: string, str2: string): number {
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

// Validation functions
export function validatePhone(phone: string): { valid: boolean; message?: string } {
  if (!phone) return { valid: false, message: 'Phone number is required' };
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return { valid: false, message: 'Phone number must be exactly 10 digits' };
  }
  return { valid: true };
}

const VALID_UNITS = ['m', 'meter', 'meters', 'metre', 'metres', 'kg', 'kilogram', 'kilograms', 'litre', 'litres', 'liter', 'liters', 'l', 'nos', 'numbers', 'sqm', 'sq.m', 'square meter', 'square meters', 'rm', 'running meter', 'running meters', 'unit', 'units', 'piece', 'pieces', 'pc', 'pcs'];

export function validateUnit(unit: string): { valid: boolean; message?: string } {
  if (!unit) return { valid: false, message: 'Unit is required' };
  const normalizedUnit = unit.trim().toLowerCase();
  if (!VALID_UNITS.includes(normalizedUnit)) {
    return { valid: false, message: `Invalid unit. Allowed units: ${VALID_UNITS.join(', ')}` };
  }
  return { valid: true };
}

export function validateName(name: string, fieldName: string = 'Name', maxLength: number = 160): { valid: boolean; message?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: `${fieldName} is required` };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: `${fieldName} cannot be empty` };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, message: `${fieldName} must be ${maxLength} characters or less` };
  }
  if (!/^[A-Za-z0-9\s\-\(\)\.,]+$/.test(trimmed)) {
    return { valid: false, message: `${fieldName} can only contain letters, numbers, spaces, and limited punctuation (- ( ) . ,)` };
  }
  return { valid: true };
}

export function validateNumeric(value: number | string, fieldName: string = 'Value', allowZero: boolean = false, min?: number): { valid: boolean; message?: string } {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} must be a valid number` };
  }
  if (!allowZero && num === 0) {
    return { valid: false, message: `${fieldName} cannot be zero` };
  }
  if (min !== undefined && num < min) {
    return { valid: false, message: `${fieldName} must be at least ${min}` };
  }
  return { valid: true };
}

export function validateLocation(location: string): { valid: boolean; message?: string } {
  if (!location || typeof location !== 'string') {
    return { valid: false, message: 'Location is required' };
  }
  if (location.trim().length === 0) {
    return { valid: false, message: 'Location cannot be empty' };
  }
  return { valid: true };
}

// Password validation
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  if (!requirements.minLength) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  }

  return {
    valid: errors.length === 0,
    errors,
    requirements,
  };
}

// Generate math captcha
export function generateCaptcha(): { question: string; answer: number } {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operators = ['+', '-', '*'];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  let answer: number;
  let question: string;
  
  switch (operator) {
    case '+':
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
      break;
    case '-':
      // Ensure positive result
      const [larger, smaller] = num1 >= num2 ? [num1, num2] : [num2, num1];
      answer = larger - smaller;
      question = `${larger} - ${smaller}`;
      break;
    case '*':
      answer = num1 * num2;
      question = `${num1} × ${num2}`;
      break;
    default:
      answer = num1 + num2;
      question = `${num1} + ${num2}`;
  }
  
  return { question, answer };
}
