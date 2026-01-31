'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

interface Order {
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

interface Manufacturer {
  id: number;
  Manufacturer_Name: string;
  Location: string;
  productsOffered: { productType: string; price: number }[];
}

interface Product {
  id: number;
  Product_Name: string;
  Sub_Type: string;
  Unit: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const authFetch = useAuthFetch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    manufacturer: '',
    product: '',
    productType: '',
    quantity: 1,
    fromLocation: '',
    toLocation: '',
    transportCost: 0,
    productCost: 0,
    totalCost: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [ordersRes, manufacturersRes, productsRes] = await Promise.all([
        authFetch('/api/orders'),
        authFetch('/api/manufacturers'),
        authFetch('/api/products')
      ]);
      
      const ordersData = await ordersRes.json();
      const manufacturersData = await manufacturersRes.json();
      const productsData = await productsRes.json();
      
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      }
      if (Array.isArray(manufacturersData)) {
        setManufacturers(manufacturersData);
      }
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  useEffect(() => {
    const filtered = orders.filter(
      (order) =>
        order.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.to_location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  // Auto-hide messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Calculate costs when form changes
  useEffect(() => {
    const selectedManufacturer = manufacturers.find(m => m.Manufacturer_Name === formData.manufacturer);
    const productPrice = selectedManufacturer?.productsOffered?.find(p => p.productType === formData.productType)?.price || 0;
    const productCost = productPrice * formData.quantity;
    const totalCost = productCost + formData.transportCost;
    
    setFormData(prev => ({
      ...prev,
      productCost,
      totalCost
    }));
  }, [formData.manufacturer, formData.productType, formData.quantity, formData.transportCost, manufacturers]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Order created successfully!');
        setShowCreateModal(false);
        setFormData({
          manufacturer: '',
          product: '',
          productType: '',
          quantity: 1,
          fromLocation: '',
          toLocation: '',
          transportCost: 0,
          productCost: 0,
          totalCost: 0
        });
        fetchData();
      } else {
        setError(data.message || 'Failed to create order');
      }
    } catch {
      setError('Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get product types for selected manufacturer
  const selectedManufacturer = manufacturers.find(m => m.Manufacturer_Name === formData.manufacturer);
  const availableProductTypes = selectedManufacturer?.productsOffered?.map(p => p.productType) || [];

  // Get unique product names
  const uniqueProducts = [...new Set(products.map(p => p.Product_Name))];

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const res = await authFetch(`/api/orders?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setOrders(orders.filter((o) => o.id !== id));
        setSuccess('Order deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete order');
      }
    } catch {
      setError('Failed to delete order');
    }
  };

  // Calculate totals
  const totalOrderValue = filteredOrders.reduce((sum, order) => sum + (order.total_cost || 0), 0);
  const totalTransportCost = filteredOrders.reduce((sum, order) => sum + (order.transport_cost || 0), 0);
  const totalProductCost = filteredOrders.reduce((sum, order) => sum + (order.product_cost || 0), 0);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner-lg"></div>
          <p className="text-cream/80 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-card max-w-7xl mx-auto p-5 md:p-8 animate-fadeIn">
      <Header title="Order History" />

      {/* Messages */}
      {error && (
        <div className="alert alert-error mb-6 animate-slideUp">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto hover:opacity-70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-6 animate-slideUp">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto hover:opacity-70">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100">
          <p className="text-blue-600/70 text-sm font-medium mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-blue-600">{filteredOrders.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-100">
          <p className="text-green-600/70 text-sm font-medium mb-1">Total Value</p>
          <p className="text-2xl font-bold text-green-600">₹{totalOrderValue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 border border-orange-100">
          <p className="text-orange-600/70 text-sm font-medium mb-1">Transport Cost</p>
          <p className="text-2xl font-bold text-orange-600">₹{totalTransportCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search orders by manufacturer, product, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-12 pr-4 py-3.5"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-muted text-sm">
          {isLoadingData ? 'Loading...' : `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoadingData ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-6 w-40 skeleton"></div>
                <div className="h-6 w-24 skeleton"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="h-4 w-full skeleton"></div>
                <div className="h-4 w-full skeleton"></div>
                <div className="h-4 w-full skeleton"></div>
                <div className="h-4 w-full skeleton"></div>
              </div>
            </div>
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state bg-white rounded-2xl py-16 border border-gray-100">
            <div className="empty-state-icon">📋</div>
            <h3 className="text-lg font-medium text-text-dark mb-1">No orders found</h3>
            <p className="text-text-muted">
              {searchTerm ? 'Try adjusting your search terms' : 'No orders have been created yet'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-slideUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 text-xs font-medium">
                      Order #{order.id}
                    </span>
                    <span className="text-text-muted text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark">{order.product}</h3>
                  <p className="text-text-muted text-sm">{order.product_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-muted text-xs mb-1">Total Cost</p>
                  <p className="text-2xl font-bold gradient-text">₹{order.total_cost?.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-text-muted text-xs mb-1">Manufacturer</p>
                  <p className="text-text-dark font-medium text-sm">{order.manufacturer}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-text-muted text-xs mb-1">Quantity</p>
                  <p className="text-text-dark font-medium text-sm">{order.quantity}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-text-muted text-xs mb-1">Product Cost</p>
                  <p className="text-text-dark font-medium text-sm">₹{order.product_cost?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-text-muted text-xs mb-1">Transport Cost</p>
                  <p className="text-text-dark font-medium text-sm">₹{order.transport_cost?.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>{order.from_location}</span>
                </div>
                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>{order.to_location}</span>
                </div>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="btn-danger px-4 py-2 rounded-xl text-sm font-medium ml-auto"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total Summary */}
      {filteredOrders.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-maroon to-maroon-dark rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4 text-cream">Order Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-cream/60 text-sm">Product Costs</p>
              <p className="text-xl font-bold text-cream">₹{totalProductCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-cream/60 text-sm">Transport Costs</p>
              <p className="text-xl font-bold text-cream">₹{totalTransportCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-cream/60 text-sm">Grand Total</p>
              <p className="text-2xl font-bold text-gold">₹{totalOrderValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-text-dark">Create New Order</h2>
                <p className="text-text-muted text-sm mt-1">Fill in the order details</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Manufacturer */}
                <div>
                  <label className="block text-text-dark font-medium mb-2 text-sm">Manufacturer *</label>
                  <select
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value, productType: '' })}
                    className="input w-full px-4 py-3"
                    required
                  >
                    <option value="">Select Manufacturer</option>
                    {manufacturers.map((m) => (
                      <option key={m.id} value={m.Manufacturer_Name}>{m.Manufacturer_Name}</option>
                    ))}
                  </select>
                </div>

                {/* Product */}
                <div>
                  <label className="block text-text-dark font-medium mb-2 text-sm">Product *</label>
                  <select
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="input w-full px-4 py-3"
                    required
                  >
                    <option value="">Select Product</option>
                    {uniqueProducts.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Product Type */}
                <div>
                  <label className="block text-text-dark font-medium mb-2 text-sm">Product Type *</label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    className="input w-full px-4 py-3"
                    required
                    disabled={!formData.manufacturer}
                  >
                    <option value="">Select Product Type</option>
                    {availableProductTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {formData.manufacturer && availableProductTypes.length === 0 && (
                    <p className="text-orange-600 text-xs mt-1">This manufacturer has no products listed</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-text-dark font-medium mb-2 text-sm">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 1 })}
                    className="input w-full px-4 py-3"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                {/* From Location */}
                <div>
                  <label className="block text-text-dark font-medium mb-2 text-sm">From Location *</label>
                  <input
                    type="text"
                    value={formData.fromLocation}
                    onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                    className="input w-full px-4 py-3"
                    placeholder="e.g., Mumbai"
                    required
                  />
                  {selectedManufacturer && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fromLocation: selectedManufacturer.Location })}
                      className="text-xs text-maroon hover:underline mt-1"
                    >
                      Use manufacturer location: {selectedManufacturer.Location}
                    </button>
                  )}
                </div>

                {/* To Location */}
                <div>
                  <label className="block text-text-dark font-medium mb-2 text-sm">To Location *</label>
                  <input
                    type="text"
                    value={formData.toLocation}
                    onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                    className="input w-full px-4 py-3"
                    placeholder="e.g., Delhi"
                    required
                  />
                </div>

                {/* Transport Cost */}
                <div>
                  <label className="block text-text-dark font-medium mb-2 text-sm">Transport Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.transportCost}
                    onChange={(e) => setFormData({ ...formData, transportCost: parseFloat(e.target.value) || 0 })}
                    className="input w-full px-4 py-3"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-text-muted mt-1">Use Transport Calculator to estimate</p>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Product Cost:</span>
                  <span className="font-medium text-text-dark">₹{formData.productCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Transport Cost:</span>
                  <span className="font-medium text-text-dark">₹{formData.transportCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                  <span className="font-semibold text-text-dark">Total Cost:</span>
                  <span className="font-bold gradient-text">₹{formData.totalCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-dark py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner-sm border-text-dark/30 border-t-text-dark"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
