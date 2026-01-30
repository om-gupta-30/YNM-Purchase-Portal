'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

interface ProductOffered {
  productType: string;
  price: number;
}

interface Product {
  id: number;
  Sub_Type: string;
}

interface Importer {
  id: number;
  Importer_ID: string;
  Company_Name: string;
  Country: string;
  City: string;
  Address: string;
  Phone: string;
  Email: string;
  Website: string;
  IEC_Code: string;
  Business_Type: string;
  Products_Imported: string;
  productsOffered: ProductOffered[];
  Countries_Importing_From: string;
  Contact_Person_Name: string;
  Contact_Person_Phone: string;
  Contact_Person_Email: string;
  Contact_Person_Designation: string;
  Bank_Name: string;
  Bank_Account_Number: string;
  Bank_IFSC: string;
  Payment_Terms: string;
  Rating: number;
  Status: string;
  created_at: string;
}

export default function ImportersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const authFetch = useAuthFetch();
  const [importers, setImporters] = useState<Importer[]>([]);
  const [filteredImporters, setFilteredImporters] = useState<Importer[]>([]);
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingImporter, setEditingImporter] = useState<Importer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState({
    companyName: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    iecCode: '',
    businessType: '',
    productsOffered: [{ productType: '', price: 0 }] as ProductOffered[],
    countriesImportingFrom: '',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    contactPersonDesignation: '',
    bankName: '',
    bankAccountNumber: '',
    bankIFSC: '',
    paymentTerms: '',
    rating: 0,
    status: 'active'
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [importersRes, productsRes] = await Promise.all([
        authFetch('/api/importers'),
        authFetch('/api/products')
      ]);
      
      const importersData = await importersRes.json();
      const productsData = await productsRes.json();
      
      if (Array.isArray(importersData)) {
        setImporters(importersData);
        setFilteredImporters(importersData);
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

  // Get unique values for filters
  const uniqueCountries = [...new Set(importers.map(i => i.Country).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(importers.map(i => i.Status).filter(Boolean))].sort();

  useEffect(() => {
    let filtered = importers;
    
    if (filterCountry !== 'all') {
      filtered = filtered.filter(importer => importer.Country === filterCountry);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(importer => importer.Status === filterStatus);
    }
    
    setFilteredImporters(filtered);
  }, [filterCountry, filterStatus, importers]);

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

  const resetForm = () => {
    setFormData({
      companyName: '',
      country: '',
      city: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      iecCode: '',
      businessType: '',
      productsOffered: [{ productType: '', price: 0 }],
      countriesImportingFrom: '',
      contactPersonName: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      contactPersonDesignation: '',
      bankName: '',
      bankAccountNumber: '',
      bankIFSC: '',
      paymentTerms: '',
      rating: 0,
      status: 'active'
    });
  };

  const handleAddImporter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await authFetch('/api/importers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add importer');
      }

      setSuccess('Importer added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add importer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImporter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImporter) return;

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await authFetch(`/api/importers/${editingImporter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update importer');
      }

      setSuccess('Importer updated successfully!');
      setShowEditModal(false);
      setEditingImporter(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update importer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImporter = async (id: number) => {
    if (!confirm('Are you sure you want to delete this importer?')) return;

    try {
      const response = await authFetch(`/api/importers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete importer');
      }

      setSuccess('Importer deleted successfully!');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete importer');
    }
  };

  const openEditModal = (importer: Importer) => {
    setEditingImporter(importer);
    setFormData({
      companyName: importer.Company_Name,
      country: importer.Country,
      city: importer.City || '',
      address: importer.Address || '',
      phone: importer.Phone || '',
      email: importer.Email || '',
      website: importer.Website || '',
      iecCode: importer.IEC_Code || '',
      businessType: importer.Business_Type || '',
      productsOffered: importer.productsOffered?.length > 0 
        ? importer.productsOffered 
        : [{ productType: '', price: 0 }],
      countriesImportingFrom: importer.Countries_Importing_From || '',
      contactPersonName: importer.Contact_Person_Name || '',
      contactPersonPhone: importer.Contact_Person_Phone || '',
      contactPersonEmail: importer.Contact_Person_Email || '',
      contactPersonDesignation: importer.Contact_Person_Designation || '',
      bankName: importer.Bank_Name || '',
      bankAccountNumber: importer.Bank_Account_Number || '',
      bankIFSC: importer.Bank_IFSC || '',
      paymentTerms: importer.Payment_Terms || '',
      rating: importer.Rating || 0,
      status: importer.Status || 'active'
    });
    setShowEditModal(true);
  };

  // Product field management
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

  // Get unique product types for dropdown
  const uniqueProductTypes = [...new Set(products.map(p => p.Sub_Type))].filter(Boolean);

  const businessTypes = [
    'Wholesaler',
    'Retailer',
    'Distributor',
    'Trading Company',
    'Direct Buyer',
    'Agent/Broker',
    'Other'
  ];

  const paymentTermsList = [
    'Advance Payment',
    'Letter of Credit (LC)',
    'Documents Against Payment (DP)',
    'Documents Against Acceptance (DA)',
    'Open Account (Net 30)',
    'Open Account (Net 60)',
    'Open Account (Net 90)',
    'Cash on Delivery (COD)',
    'Other'
  ];

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

  const renderForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Company Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Company Name *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="Enter company name"
              required
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Business Type</label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="input w-full px-4 py-2.5"
            >
              <option value="">Select business type</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Country *</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., United States, Germany"
              required
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., New York, Berlin"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Full Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input w-full px-4 py-2.5 min-h-[70px] resize-y"
              placeholder="Enter complete address"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">IEC Code (Import Export Code)</label>
            <input
              type="text"
              value={formData.iecCode}
              onChange={(e) => setFormData({ ...formData, iecCode: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., AABCT1234A"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input w-full px-4 py-2.5"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="company@example.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="https://www.example.com"
            />
          </div>
        </div>
      </div>

      {/* Contact Person */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Contact Person
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Name</label>
            <input
              type="text"
              value={formData.contactPersonName}
              onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="Contact person name"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Designation</label>
            <input
              type="text"
              value={formData.contactPersonDesignation}
              onChange={(e) => setFormData({ ...formData, contactPersonDesignation: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., Purchase Manager"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Phone</label>
            <input
              type="tel"
              value={formData.contactPersonPhone}
              onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="Contact person phone"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Email</label>
            <input
              type="email"
              value={formData.contactPersonEmail}
              onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="person@example.com"
            />
          </div>
        </div>
      </div>

      {/* Import Details */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-l-4 border-green-500">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-text-dark flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products & Prices
          </h4>
          <button
            type="button"
            onClick={addProductField}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
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
                  className="input w-full px-4 py-2.5"
                >
                  <option value="">Select Product Type</option>
                  {uniqueProductTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  value={product.price || ''}
                  onChange={(e) => updateProductField(index, 'price', parseFloat(e.target.value) || 0)}
                  className="input w-full px-4 py-2.5"
                  placeholder="Price"
                  min="0"
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
        
        <div className="mt-4">
          <label className="block text-text-dark font-medium mb-1.5 text-sm">Countries Importing From</label>
          <textarea
            value={formData.countriesImportingFrom}
            onChange={(e) => setFormData({ ...formData, countriesImportingFrom: e.target.value })}
            className="input w-full px-4 py-2.5 min-h-[70px] resize-y"
            placeholder="List countries (e.g., India, China, Vietnam)"
            rows={2}
          />
        </div>
      </div>

      {/* Bank & Payment Details */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Bank & Payment Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Bank Name</label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="Bank name"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Account Number</label>
            <input
              type="text"
              value={formData.bankAccountNumber}
              onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="Account number"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">IFSC / SWIFT Code</label>
            <input
              type="text"
              value={formData.bankIFSC}
              onChange={(e) => setFormData({ ...formData, bankIFSC: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="IFSC or SWIFT code"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Payment Terms</label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className="input w-full px-4 py-2.5"
            >
              <option value="">Select payment terms</option>
              {paymentTermsList.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Rating
        </h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center gap-1 min-w-[80px]">
            <span className="text-2xl font-bold text-yellow-500">{formData.rating}</span>
            <span className="text-text-muted">/ 5</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            isEdit ? setShowEditModal(false) : setShowAddModal(false);
            resetForm();
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
              <div className="spinner-sm"></div>
              <span>{isEdit ? 'Updating...' : 'Adding...'}</span>
            </>
          ) : (
            <span>{isEdit ? 'Update Importer' : 'Add Importer'}</span>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="container-card w-full p-5 md:p-8 animate-fadeIn">
      <Header title="Importers" />

      {/* Messages */}
      {error && (
        <div className="alert alert-error mb-6 animate-slideUp">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-6 animate-slideUp">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Countries</option>
          {uniqueCountries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Status</option>
          {uniqueStatuses.map(status => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
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
          <span>Add Importer</span>
        </button>
      </div>

      {/* Importers Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">ID</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Company</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Location</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Contact</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Products Imported</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Importing From</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Status</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Rating</th>
                <th className="px-3 py-4 text-right text-cream font-semibold text-xs whitespace-nowrap sticky right-0 bg-maroon">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-3 py-4"><div className="h-4 w-12 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-32 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-32 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-28 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-6 w-16 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-16 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-24 skeleton ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredImporters.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16">
                    <div className="empty-state">
                      <div className="empty-state-icon">🌍</div>
                      <h3 className="text-lg font-medium text-text-dark mb-1">No importers found</h3>
                      <p className="text-text-muted">
                        {(filterCountry !== 'all' || filterStatus !== 'all') ? 'Try adjusting your filters' : 'Add your first importer to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredImporters.map((importer, index) => (
                  <tr 
                    key={importer.id} 
                    className="table-row animate-fadeIn"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium">
                        {importer.Importer_ID}
                      </span>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div>
                        <div className="font-medium text-text-dark text-sm">{importer.Company_Name}</div>
                        {importer.Business_Type && (
                          <div className="text-text-muted text-xs">{importer.Business_Type}</div>
                        )}
                        {importer.IEC_Code && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs mt-1 font-mono">
                            IEC: {importer.IEC_Code}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1 text-text-muted text-sm">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <div className="text-text-dark font-medium">{importer.Country}</div>
                          {importer.City && <div className="text-text-muted text-xs">{importer.City}</div>}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        {importer.Phone && (
                          <div className="flex items-center gap-1 text-text-dark text-xs">
                            <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{importer.Phone}</span>
                          </div>
                        )}
                        {importer.Email && (
                          <div className="flex items-center gap-1 text-text-muted text-xs">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{importer.Email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="space-y-1.5">
                        {importer.productsOffered && importer.productsOffered.length > 0 ? (
                          importer.productsOffered.map((product, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs">
                                {product.productType}
                              </span>
                              <span className="text-green-600 text-xs font-semibold">
                                ₹{product.price?.toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="text-text-dark text-xs">
                        {importer.Countries_Importing_From || '-'}
                      </div>
                    </td>
                    
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        importer.Status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : importer.Status === 'inactive'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {importer.Status || 'Active'}
                      </span>
                    </td>
                    
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-text-dark text-sm font-medium">{importer.Rating || 0}</span>
                      </div>
                    </td>
                    
                    <td className="px-3 py-4 sticky right-0 bg-white">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(importer)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          Edit
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteImporter(importer.id)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Add New Importer
              </h3>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderForm(handleAddImporter, false)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingImporter && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                Edit Importer
              </h3>
              <button
                onClick={() => { setShowEditModal(false); setEditingImporter(null); resetForm(); }}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderForm(handleEditImporter, true)}
          </div>
        </div>
      )}
    </div>
  );
}
