// ================================
// API Utility - Centralized API calls
// ================================

// ---- API BASE URL (single source of truth) ----
const API_BASE_URL = (() => {
  if (window.CONFIG && window.CONFIG.API_BASE_URL) {
    return window.CONFIG.API_BASE_URL;
  }

  // Local fallback (only for dev)
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    return 'http://localhost:5002/api';
  }

  console.error('CONFIG.API_BASE_URL is not defined');
  return '';
})();

// ---- Auth token helpers ----
function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

function removeAuthToken() {
  localStorage.removeItem('authToken');
}

// ---- Core API request wrapper ----
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();

  const requestOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {})
    },
    body: options.body || undefined
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken();
        window.location.href = '/login.html';
        return null;
      }

      if (response.status === 409) {
        throw {
          status: 409,
          message: data?.message || 'Duplicate entry',
          existing: data?.existing
        };
      }

      throw new Error(data?.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ================================
// AUTH API
// ================================
const authAPI = {
  async login(username, password) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (response?.success) {
      setAuthToken(response.token);
      localStorage.setItem('activeUser', response.user.username);
      localStorage.setItem('userRole', response.user.role);
    }

    return response;
  },

  logout() {
    removeAuthToken();
    localStorage.removeItem('activeUser');
    localStorage.removeItem('userRole');
    window.location.href = '/login.html';
  },

  getCurrentUser() {
    return apiRequest('/auth/me');
  },

  getEmployees() {
    return apiRequest('/auth/employees');
  }
};

// ================================
// TASKS API
// ================================
const tasksAPI = {
  getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/tasks${params ? `?${params}` : ''}`);
  },

  create(data) {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update(id, data) {
    return apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete(id) {
    return apiRequest(`/tasks/${id}`, { method: 'DELETE' });
  }
};

// ================================
// ORDERS API
// ================================
const ordersAPI = {
  getAll() {
    return apiRequest('/orders');
  },

  create(data) {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  delete(id) {
    return apiRequest(`/orders/${id}`, { method: 'DELETE' });
  }
};

// ================================
// MANUFACTURERS API
// ================================
const manufacturersAPI = {
  getAll() {
    return apiRequest('/manufacturers');
  },

  create(data) {
    return apiRequest('/manufacturers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update(id, data) {
    return apiRequest(`/manufacturers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete(id) {
    return apiRequest(`/manufacturers/${id}`, { method: 'DELETE' });
  }
};

// ================================
// PRODUCTS API
// ================================
const productsAPI = {
  getAll() {
    return apiRequest('/products');
  },

  create(data) {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update(id, data) {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete(id) {
    return apiRequest(`/products/${id}`, { method: 'DELETE' });
  }
};

// ================================
// PDF API (via backend ONLY)
// ================================
const pdfAPI = {
  async extract(file, manufacturerList = null) {
    const formData = new FormData();
    formData.append('file', file);

    if (manufacturerList) {
      formData.append('manufacturer_list', JSON.stringify(manufacturerList));
    }

    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}/orders/extract-pdf`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'PDF extraction failed');
    }

    return response.json();
  }
};

// ---- Expose APIs globally ----
window.authAPI = authAPI;
window.tasksAPI = tasksAPI;
window.ordersAPI = ordersAPI;
window.manufacturersAPI = manufacturersAPI;
window.productsAPI = productsAPI;
window.pdfAPI = pdfAPI;
