// User types
export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'employee';
  created_at: string;
}

export interface UserPayload {
  id: number;
  username: string;
  role: 'admin' | 'employee';
}

// Product types
export interface Product {
  id: number;
  name: string;
  subtypes: string[];
  unit: string;
  notes?: string;
  created_at: string;
}

export interface CreateProductInput {
  name: string;
  subtypes: string[];
  unit: string;
  notes?: string;
}

// Manufacturer types
export interface ProductOffered {
  productType: string;
  price: number;
}

export interface Manufacturer {
  id: number;
  name: string;
  location: string;
  contact: string;
  products_offered: ProductOffered[];
  created_at: string;
}

export interface CreateManufacturerInput {
  name: string;
  location: string;
  contact: string;
  products_offered: ProductOffered[];
}

// Order types
export interface Order {
  id: number;
  manufacturer: string;
  product: string;
  product_type: string;
  quantity: number;
  from_location: string;
  to_location: string;
  transport_cost: number;
  product_cost: number;
  total_cost: number;
  created_at: string;
}

export interface CreateOrderInput {
  manufacturer: string;
  product: string;
  product_type: string;
  quantity: number;
  from_location: string;
  to_location: string;
  transport_cost: number;
  product_cost: number;
  total_cost: number;
}

// Location types
export interface Location {
  id: number;
  location_id: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: UserPayload;
}

export interface PdfExtractResponse {
  success: boolean;
  data: {
    manufacturer?: string;
    product?: string;
    type?: string;
    quantity?: number;
    from_location?: string;
    to_location?: string;
  };
}

// Chatbot types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotResponse {
  success: boolean;
  response: string;
}
