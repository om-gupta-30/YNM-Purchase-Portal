'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

interface ProductOffered {
  productType: string;
  price: number;
}

interface Manufacturer {
  _id: number;
  id: number;
  Manufacturer_ID: string;
  Manufacturer_Name: string;
  Location: string;
  Contact_Number: string;
  Email: string;
  Contact_Person_Name: string;
  Contact_Person_Phone: string;
  Contact_Person_Email: string;
  Contact_Person_Designation: string;
  GST_Number: string;
  Website: string;
  Products_Offered: string;
  'Product_Prices (Rs.)': string;
  productsOffered: ProductOffered[];
}

interface Product {
  id: number;
  Product_Name: string;
  Sub_Type: string;
}

export default function ManufacturersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const authFetch = useAuthFetch();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [filteredManufacturers, setFilteredManufacturers] = useState<Manufacturer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact: '',
    email: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    contactPersonDesignation: '',
    gstNumber: '',
    website: '',
    productsOffered: [{ productType: '', price: 0 }]
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [manufacturersRes, productsRes] = await Promise.all([
        authFetch('/api/manufacturers'),
        authFetch('/api/products')
      ]);
      
      const manufacturersData = await manufacturersRes.json();
      const productsData = await productsRes.json();
      
      if (Array.isArray(manufacturersData)) {
        setManufacturers(manufacturersData);
        setFilteredManufacturers(manufacturersData);
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

  // Get unique locations and product types for filters
  const uniqueLocations = [...new Set(manufacturers.map(m => m.Location).filter(Boolean))].sort();
  const uniqueProductTypes = [...new Set(products.map(p => p.Sub_Type).filter(Boolean))].sort();

  useEffect(() => {
    let filtered = manufacturers;
    
    if (filterLocation !== 'all') {
      filtered = filtered.filter(m => m.Location === filterLocation);
    }
    
    if (filterProduct !== 'all') {
      filtered = filtered.filter(m => 
        m.productsOffered?.some(p => p.productType === filterProduct) ||
        m.Products_Offered?.toLowerCase().includes(filterProduct.toLowerCase())
      );
    }
    
    setFilteredManufacturers(filtered);
  }, [filterLocation, filterProduct, manufacturers]);

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

  const handleAddManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/manufacturers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Manufacturer added successfully!');
        setShowAddModal(false);
        setFormData({
          name: '',
          location: '',
          contact: '',
          email: '',
          contactPersonName: '',
          contactPersonPhone: '',
          contactPersonEmail: '',
          contactPersonDesignation: '',
          gstNumber: '',
          website: '',
          productsOffered: [{ productType: '', price: 0 }]
        });
        fetchData();
      } else {
        setError(data.message || 'Failed to add manufacturer');
      }
    } catch {
      setError('Failed to add manufacturer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManufacturer) return;
    
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await authFetch(`/api/manufacturers?id=${editingManufacturer.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Manufacturer updated successfully!');
        setShowEditModal(false);
        setEditingManufacturer(null);
        setFormData({
          name: '',
          location: '',
          contact: '',
          email: '',
          contactPersonName: '',
          contactPersonPhone: '',
          contactPersonEmail: '',
          contactPersonDesignation: '',
          gstNumber: '',
          website: '',
          productsOffered: [{ productType: '', price: 0 }]
        });
        fetchData();
      } else {
        setError(data.message || 'Failed to update manufacturer');
      }
    } catch {
      setError('Failed to update manufacturer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    setFormData({
      name: manufacturer.Manufacturer_Name,
      location: manufacturer.Location,
      contact: manufacturer.Contact_Number,
      email: manufacturer.Email || '',
      contactPersonName: manufacturer.Contact_Person_Name || '',
      contactPersonPhone: manufacturer.Contact_Person_Phone || '',
      contactPersonEmail: manufacturer.Contact_Person_Email || '',
      contactPersonDesignation: manufacturer.Contact_Person_Designation || '',
      gstNumber: manufacturer.GST_Number || '',
      website: manufacturer.Website || '',
      productsOffered: manufacturer.productsOffered.length > 0 
        ? manufacturer.productsOffered 
        : [{ productType: '', price: 0 }]
    });
    setShowEditModal(true);
  };

  const handleDeleteManufacturer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this manufacturer?')) return;

    try {
      const res = await authFetch(`/api/manufacturers?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setManufacturers(manufacturers.filter((m) => m.id !== id));
        setSuccess('Manufacturer deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete manufacturer');
      }
    } catch {
      setError('Failed to delete manufacturer');
    }
  };

  const addProductField = () => {
    setFormData({
      ...formData,
      productsOffered: [...formData.productsOffered, { productType: '', price: 0 }]
    });
  };

  const removeProductField = (index: number) => {
    if (formData.productsOffered.length > 1) {
      const newProducts = formData.productsOffered.filter((_, i) => i !== index);
      setFormData({ ...formData, productsOffered: newProducts });
    }
  };

  const updateProductField = (index: number, field: 'productType' | 'price', value: string | number) => {
    const newProducts = [...formData.productsOffered];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData({ ...formData, productsOffered: newProducts });
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
      <Header title="Manufacturers" />

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
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Locations</option>
          {uniqueLocations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Products</option>
          {uniqueProductTypes.map(type => (
            <option key={type} value={type}>{type}</option>
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
          Add Manufacturer
        </button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-muted text-sm">
          {isLoadingData ? 'Loading...' : `${filteredManufacturers.length} manufacturer${filteredManufacturers.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Manufacturers Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">ID</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Company Name</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Location</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">GST Number</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Company Contact</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Contact Person</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Products & Prices (₹)</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Website</th>
                <th className="px-3 py-4 text-right text-cream font-semibold text-xs whitespace-nowrap sticky right-0 bg-maroon">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-3 py-4"><div className="h-4 w-12 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-28 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-28 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-32 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-36 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-40 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-24 skeleton ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredManufacturers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16">
                    <div className="empty-state">
                      <div className="empty-state-icon">🏭</div>
                      <h3 className="text-lg font-medium text-text-dark mb-1">No manufacturers found</h3>
                      <p className="text-text-muted">
                        {(filterLocation !== 'all' || filterProduct !== 'all') ? 'Try adjusting your filters' : 'Add your first manufacturer to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredManufacturers.map((manufacturer, index) => (
                  <tr 
                    key={manufacturer.id} 
                    className="table-row animate-fadeIn"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* ID */}
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                        {manufacturer.Manufacturer_ID}
                      </span>
                    </td>
                    
                    {/* Company Name */}
                    <td className="px-3 py-4">
                      <div className="font-medium text-text-dark text-sm">
                        {manufacturer.Manufacturer_Name}
                      </div>
                    </td>
                    
                    {/* Location */}
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1 text-text-muted text-sm">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{manufacturer.Location}</span>
                      </div>
                    </td>
                    
                    {/* GST Number */}
                    <td className="px-3 py-4">
                      {manufacturer.GST_Number ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-mono">
                          {manufacturer.GST_Number}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    
                    {/* Company Contact (Phone + Email) */}
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-text-dark text-xs">
                          <svg className="w-3 h-3 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{manufacturer.Contact_Number}</span>
                        </div>
                        {manufacturer.Email && (
                          <div className="flex items-center gap-1 text-text-muted text-xs">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{manufacturer.Email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Contact Person */}
                    <td className="px-3 py-4">
                      {manufacturer.Contact_Person_Name ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-text-dark text-xs font-medium">{manufacturer.Contact_Person_Name}</span>
                          </div>
                          {manufacturer.Contact_Person_Designation && (
                            <div className="text-text-muted text-xs pl-4">{manufacturer.Contact_Person_Designation}</div>
                          )}
                          {manufacturer.Contact_Person_Phone && (
                            <div className="flex items-center gap-1 text-text-muted text-xs">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{manufacturer.Contact_Person_Phone}</span>
                            </div>
                          )}
                          {manufacturer.Contact_Person_Email && (
                            <div className="flex items-center gap-1 text-text-muted text-xs">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{manufacturer.Contact_Person_Email}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    
                    {/* Products & Prices - Show each product with its price */}
                    <td className="px-3 py-4">
                      <div className="space-y-1.5">
                        {manufacturer.productsOffered && manufacturer.productsOffered.length > 0 ? (
                          manufacturer.productsOffered.map((product, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                                {product.productType}
                              </span>
                              <span className="text-green-600 text-xs font-semibold">
                                ₹{product.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
                      </div>
                    </td>
                    
                    {/* Website */}
                    <td className="px-3 py-4">
                      {manufacturer.Website ? (
                        <a 
                          href={manufacturer.Website.startsWith('http') ? manufacturer.Website : `https://${manufacturer.Website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-maroon hover:text-maroon-dark text-xs font-medium transition-colors"
                        >
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Visit Site</span>
                        </a>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    
                    {/* Actions - Sticky */}
                    <td className="px-3 py-4 sticky right-0 bg-white">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(manufacturer)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          Edit
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteManufacturer(manufacturer.id)}
                            className="btn-danger px-3 py-1.5 rounded-lg text-xs font-medium"
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
      
      {/* Scroll hint for mobile */}
      <p className="text-text-muted text-xs mt-2 text-center md:hidden">
        ← Scroll horizontally to see all columns →
      </p>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-text-dark">Add New Manufacturer</h2>
                <p className="text-text-muted text-sm mt-1">Fill in the manufacturer details</p>
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

            <form onSubmit={handleAddManufacturer} className="space-y-5">
              {/* Company Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-maroon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Manufacturer Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="e.g., ABC Industries Pvt. Ltd."
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Location *</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., Mumbai, Maharashtra"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">GST Number</label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., 27AABCU9603R1ZM"
                        maxLength={15}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Company Phone *</label>
                      <input
                        type="tel"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., 9876543210"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Company Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., info@abcindustries.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="e.g., https://www.abcindustries.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person Section */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact Person Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Contact Person Name</label>
                      <input
                        type="text"
                        value={formData.contactPersonName}
                        onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., Rajesh Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Designation</label>
                      <input
                        type="text"
                        value={formData.contactPersonDesignation}
                        onChange={(e) => setFormData({ ...formData, contactPersonDesignation: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., Sales Manager"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Contact Person Phone</label>
                      <input
                        type="tel"
                        value={formData.contactPersonPhone}
                        onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., 9876543211"
                      />
                    </div>
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Contact Person Email</label>
                      <input
                        type="email"
                        value={formData.contactPersonEmail}
                        onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., rajesh@abcindustries.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-dark flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Products Offered *
                  </h3>
                  <button
                    type="button"
                    onClick={addProductField}
                    className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.productsOffered.map((product, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-white rounded-xl border border-green-200">
                      <div className="flex-1">
                        <select
                          value={product.productType}
                          onChange={(e) => updateProductField(index, 'productType', e.target.value)}
                          className="input w-full px-3 py-2.5 text-sm"
                          required
                        >
                          <option value="">Select Product Type</option>
                          {uniqueProductTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          value={product.price || ''}
                          onChange={(e) => updateProductField(index, 'price', parseFloat(e.target.value) || 0)}
                          className="input w-full px-3 py-2.5 text-sm"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      {formData.productsOffered.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductField(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                      <span>Add Manufacturer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingManufacturer && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-text-dark">Edit Manufacturer</h2>
                <p className="text-text-muted text-sm mt-1">Update the manufacturer details</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingManufacturer(null);
                  setFormData({
                    name: '',
                    location: '',
                    contact: '',
                    email: '',
                    contactPersonName: '',
                    contactPersonPhone: '',
                    contactPersonEmail: '',
                    contactPersonDesignation: '',
                    gstNumber: '',
                    website: '',
                    productsOffered: [{ productType: '', price: 0 }]
                  });
                }}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditManufacturer} className="space-y-5">
              {/* Company Information Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-maroon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Manufacturer Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="e.g., ABC Industries Pvt. Ltd."
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Location *</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., Mumbai, Maharashtra"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">GST Number</label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., 27AABCU9603R1ZM"
                        maxLength={15}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Company Phone *</label>
                      <input
                        type="tel"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., 9876543210"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Company Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., info@abcindustries.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="e.g., https://www.abcindustries.com"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Person Section */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Contact Person Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Contact Person Name</label>
                      <input
                        type="text"
                        value={formData.contactPersonName}
                        onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., Rajesh Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Designation</label>
                      <input
                        type="text"
                        value={formData.contactPersonDesignation}
                        onChange={(e) => setFormData({ ...formData, contactPersonDesignation: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., Sales Manager"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Contact Person Phone</label>
                      <input
                        type="tel"
                        value={formData.contactPersonPhone}
                        onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., 9876543211"
                      />
                    </div>
                    <div>
                      <label className="block text-text-dark font-medium mb-1.5 text-sm">Contact Person Email</label>
                      <input
                        type="email"
                        value={formData.contactPersonEmail}
                        onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                        className="input w-full px-4 py-2.5"
                        placeholder="e.g., rajesh@abcindustries.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-dark flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Products Offered *
                  </h3>
                  <button
                    type="button"
                    onClick={addProductField}
                    className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.productsOffered.map((product, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-white rounded-xl border border-green-200">
                      <div className="flex-1">
                        <select
                          value={product.productType}
                          onChange={(e) => updateProductField(index, 'productType', e.target.value)}
                          className="input w-full px-3 py-2.5 text-sm"
                          required
                        >
                          <option value="">Select Product Type</option>
                          {uniqueProductTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          value={product.price || ''}
                          onChange={(e) => updateProductField(index, 'price', parseFloat(e.target.value) || 0)}
                          className="input w-full px-3 py-2.5 text-sm"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      {formData.productsOffered.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductField(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingManufacturer(null);
                    setFormData({
                      name: '',
                      location: '',
                      contact: '',
                      email: '',
                      contactPersonName: '',
                      contactPersonPhone: '',
                      contactPersonEmail: '',
                      contactPersonDesignation: '',
                      gstNumber: '',
                      website: '',
                      productsOffered: [{ productType: '', price: 0 }]
                    });
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
                    <span>Update Manufacturer</span>
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
