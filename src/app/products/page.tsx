'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

interface Product {
  _id: number;
  id: number;
  Product_ID: string;
  Product_Name: string;
  Sub_Type: string;
  Unit: string;
  Specifications: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const authFetch = useAuthFetch();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    Product_Name: '',
    Sub_Type: '',
    Unit: 'm',
    Specifications: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await authFetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        setFilteredProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated, fetchProducts]);

  // Get unique product types and units for filters
  const uniqueTypes = [...new Set(products.map(p => p.Sub_Type).filter(Boolean))].sort();
  const uniqueUnits = [...new Set(products.map(p => p.Unit).filter(Boolean))].sort();

  useEffect(() => {
    let filtered = products;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(product => product.Sub_Type === filterType);
    }
    
    if (filterUnit !== 'all') {
      filtered = filtered.filter(product => product.Unit === filterUnit);
    }
    
    setFilteredProducts(filtered);
  }, [filterType, filterUnit, products]);

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Product added successfully!');
        setShowAddModal(false);
        setFormData({ Product_Name: '', Sub_Type: '', Unit: 'm', Specifications: '' });
        fetchProducts();
      } else {
        setError(data.message || 'Failed to add product');
      }
    } catch {
      setError('Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await authFetch(`/api/products?id=${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Product updated successfully!');
        setShowEditModal(false);
        setEditingProduct(null);
        setFormData({ Product_Name: '', Sub_Type: '', Unit: 'm', Specifications: '' });
        fetchProducts();
      } else {
        setError(data.message || 'Failed to update product');
      }
    } catch {
      setError('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      Product_Name: product.Product_Name,
      Sub_Type: product.Sub_Type,
      Unit: product.Unit,
      Specifications: product.Specifications || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (product: Product) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await authFetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setProducts(products.filter((p) => p.id !== id));
        setSuccess('Product deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete product');
      }
    } catch {
      setError('Failed to delete product');
    }
  };

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
      <Header title="Products" />

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

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Product Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={filterUnit}
          onChange={(e) => setFilterUnit(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Units</option>
          {uniqueUnits.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
        <div className="flex-1"></div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600 text-sm font-medium">
          {isLoadingData ? 'Loading...' : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-5 py-4 text-left text-cream font-semibold text-sm">S.No</th>
                <th className="px-5 py-4 text-left text-cream font-semibold text-sm">Product Name</th>
                <th className="px-5 py-4 text-left text-cream font-semibold text-sm">Type</th>
                <th className="px-5 py-4 text-left text-cream font-semibold text-sm">Unit</th>
                <th className="px-5 py-4 text-left text-cream font-semibold text-sm">Specifications</th>
                <th className="px-5 py-4 text-right text-cream font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-5 py-4"><div className="h-4 w-16 skeleton"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-40 skeleton"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 skeleton"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 skeleton"></div></td>
                    <td className="px-5 py-4"><div className="h-8 w-20 skeleton ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16">
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <h3 className="text-lg font-medium text-text-dark mb-1">No products found</h3>
                      <p className="text-gray-500">
                        {(filterType !== 'all' || filterUnit !== 'all') ? 'Try adjusting your filters' : 'Add your first product to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr 
                    key={`${product.id}-${product.Sub_Type}`} 
                    className="table-row animate-fadeIn"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-maroon/10 text-maroon text-sm font-bold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-text-dark font-medium">{product.Product_Name}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-semibold">
                        {product.Sub_Type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {product.Unit ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-xs font-semibold">
                          {product.Unit}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm max-w-[200px]" title={product.Specifications || ''}>
                      {product.Specifications ? (
                        <span className="text-gray-700 font-medium">{product.Specifications}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(product)}
                          className="px-3.5 py-2 rounded-lg text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                        >
                          View
                        </button>
                        {/* Both admin and employee can edit */}
                        <button
                          onClick={() => openEditModal(product)}
                          className="px-3.5 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          Edit
                        </button>
                        {/* Only admin can delete */}
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn-danger px-3.5 py-2 rounded-lg text-sm font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-text-dark">Add New Product</h2>
                <p className="text-gray-500 text-sm mt-1">Fill in the product details below</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="block text-text-dark font-medium mb-2 text-sm">Product Name *</label>
                <input
                  type="text"
                  value={formData.Product_Name}
                  onChange={(e) => setFormData({ ...formData, Product_Name: e.target.value })}
                  className="input w-full px-4 py-3"
                  placeholder="e.g., Safety Helmet"
                  required
                />
              </div>
              <div>
                <label className="block text-text-dark font-medium mb-2 text-sm">Product Type *</label>
                <input
                  type="text"
                  value={formData.Sub_Type}
                  onChange={(e) => setFormData({ ...formData, Sub_Type: e.target.value })}
                  className="input w-full px-4 py-3"
                  placeholder="e.g., Industrial Grade"
                  required
                />
              </div>
              <div>
                <label className="block text-text-dark font-medium mb-2 text-sm">Unit *</label>
                <select
                  value={formData.Unit}
                  onChange={(e) => setFormData({ ...formData, Unit: e.target.value })}
                  className="input w-full px-4 py-3"
                >
                  <option value="m">Meter (m)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="litre">Litre</option>
                  <option value="nos">Numbers (nos)</option>
                  <option value="sqm">Square Meter (sqm)</option>
                  <option value="rm">Running Meter (rm)</option>
                </select>
              </div>
              <div>
                <label className="block text-text-dark font-medium mb-2 text-sm">Specifications *</label>
                <textarea
                  value={formData.Specifications}
                  onChange={(e) => setFormData({ ...formData, Specifications: e.target.value })}
                  className="input w-full px-4 py-3 resize-none"
                  rows={3}
                  placeholder="e.g., Material: ABS Plastic, Weight: 350g, Color: Yellow, Certification: IS 2925"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">Enter product specifications like material, dimensions, certifications, etc.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-text-dark">Edit Product</h2>
                <p className="text-gray-500 text-sm mt-1">Update the product details</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  setFormData({ Product_Name: '', Sub_Type: '', Unit: 'm', Specifications: '' });
                }}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-5">
              <div>
                <label className="block text-text-dark font-medium mb-2 text-sm">Product Name *</label>
                <input
                  type="text"
                  value={formData.Product_Name}
                  onChange={(e) => setFormData({ ...formData, Product_Name: e.target.value })}
                  className="input w-full px-4 py-3"
                  placeholder="e.g., Safety Helmet"
                  required
                />
              </div>
              <div>
                <label className="block text-text-dark font-medium mb-2 text-sm">Product Type *</label>
                <input
                  type="text"
                  value={formData.Sub_Type}
                  onChange={(e) => setFormData({ ...formData, Sub_Type: e.target.value })}
                  className="input w-full px-4 py-3"
                  placeholder="e.g., Industrial Grade"
                  required
                />
              </div>
              <div>
                <label className="block text-text-dark font-medium mb-2 text-sm">Unit *</label>
                <select
                  value={formData.Unit}
                  onChange={(e) => setFormData({ ...formData, Unit: e.target.value })}
                  className="input w-full px-4 py-3"
                >
                  <option value="m">Meter (m)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="litre">Litre</option>
                  <option value="nos">Numbers (nos)</option>
                  <option value="sqm">Square Meter (sqm)</option>
                  <option value="rm">Running Meter (rm)</option>
                </select>
              </div>
              <div>
                <label className="block text-text-dark font-medium mb-2 text-sm">Specifications *</label>
                <textarea
                  value={formData.Specifications}
                  onChange={(e) => setFormData({ ...formData, Specifications: e.target.value })}
                  className="input w-full px-4 py-3 resize-none"
                  rows={3}
                  placeholder="e.g., Material: ABS Plastic, Weight: 350g, Color: Yellow, Certification: IS 2925"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">Enter product specifications like material, dimensions, certifications, etc.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                    setFormData({ Product_Name: '', Sub_Type: '', Unit: 'm', Specifications: '' });
                  }}
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
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingProduct && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-dark">Product Details</h2>
                  <p className="text-gray-500 text-sm">{viewingProduct.Product_ID}</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Product Name</p>
                    <p className="text-sm font-medium text-text-dark">{viewingProduct.Product_Name || '-'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Product Type</p>
                    <p className="text-sm font-medium text-text-dark">{viewingProduct.Sub_Type || '-'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Unit</p>
                    <p className="text-sm font-medium text-text-dark">{viewingProduct.Unit || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Specifications
                </h3>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-text-dark whitespace-pre-wrap">{viewingProduct.Specifications || 'No specifications available'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-dark py-3 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(viewingProduct);
                }}
                className="flex-1 btn-primary py-3 rounded-xl font-medium"
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
