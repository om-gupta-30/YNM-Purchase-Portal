'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { validators, formatPhone, formatGST, formatPAN, formatPincode } from '@/utils/validation';

interface Customer {
  id: number;
  Customer_ID: string;
  Company_Name: string;
  Contact_Person: string;
  Designation: string;
  Phone: string;
  Mobile: string;
  Email: string;
  Website: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  PIN_Code: string;
  GST_Number: string;
  PAN_Number: string;
  Payment_Terms: string;
  Credit_Limit: string;
  Status: string;
  Notes: string;
  created_at: string;
}

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

const paymentTermsList = ['Advance', 'COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Credit'];

export default function CustomersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const authFetch = useAuthFetch();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    gstNumber: '',
    panNumber: '',
    paymentTerms: '',
    creditLimit: '',
    status: 'active',
    notes: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!formData.companyName.trim()) errors.companyName = 'Company name is required';
    
    // Phone validation (10 digits)
    if (formData.phone) {
      const phoneResult = validators.phone(formData.phone);
      if (!phoneResult.valid) errors.phone = phoneResult.message;
    }
    
    // Mobile validation (10 digits)
    if (formData.mobile) {
      const mobileResult = validators.phone(formData.mobile);
      if (!mobileResult.valid) errors.mobile = mobileResult.message;
    }
    
    // Email validation
    if (formData.email) {
      const emailResult = validators.email(formData.email);
      if (!emailResult.valid) errors.email = emailResult.message;
    }
    
    // GST validation
    if (formData.gstNumber) {
      const gstResult = validators.gst(formData.gstNumber);
      if (!gstResult.valid) errors.gstNumber = gstResult.message;
    }
    
    // PAN validation
    if (formData.panNumber) {
      const panResult = validators.pan(formData.panNumber);
      if (!panResult.valid) errors.panNumber = panResult.message;
    }
    
    // PIN code validation (6 digits)
    if (formData.pinCode) {
      const pinResult = validators.pincode(formData.pinCode);
      if (!pinResult.valid) errors.pinCode = pinResult.message;
    }
    
    // Website validation
    if (formData.website) {
      const websiteResult = validators.website(formData.website);
      if (!websiteResult.valid) errors.website = websiteResult.message;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await authFetch('/api/customers');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCustomers(data);
        setFilteredCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated, fetchCustomers]);

  // Get unique values for filters
  const uniqueStates = [...new Set(customers.map(c => c.State).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(customers.map(c => c.Status).filter(Boolean))].sort();

  useEffect(() => {
    let filtered = customers;
    
    if (filterState !== 'all') {
      filtered = filtered.filter(customer => customer.State === filterState);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => customer.Status === filterStatus);
    }
    
    setFilteredCustomers(filtered);
  }, [filterState, filterStatus, customers]);

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
      contactPerson: '',
      designation: '',
      phone: '',
      mobile: '',
      email: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pinCode: '',
      gstNumber: '',
      panNumber: '',
      paymentTerms: '',
      creditLimit: '',
      status: 'active',
      notes: ''
    });
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      companyName: customer.Company_Name || '',
      contactPerson: customer.Contact_Person || '',
      designation: customer.Designation || '',
      phone: customer.Phone || '',
      mobile: customer.Mobile || '',
      email: customer.Email || '',
      website: customer.Website || '',
      address: customer.Address || '',
      city: customer.City || '',
      state: customer.State || '',
      country: customer.Country || 'India',
      pinCode: customer.PIN_Code || '',
      gstNumber: customer.GST_Number || '',
      panNumber: customer.PAN_Number || '',
      paymentTerms: customer.Payment_Terms || '',
      creditLimit: customer.Credit_Limit || '',
      status: customer.Status || 'active',
      notes: customer.Notes || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (customer: Customer) => {
    setViewingCustomer(customer);
    setShowViewModal(true);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add customer');
      }

      setSuccess('Customer added successfully!');
      setShowAddModal(false);
      resetForm();
      setValidationErrors({});
      fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const res = await authFetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      setSuccess('Customer updated successfully!');
      setShowEditModal(false);
      setEditingCustomer(null);
      resetForm();
      setValidationErrors({});
      fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const res = await authFetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete customer');
      }

      setSuccess('Customer deleted successfully!');
      fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              onChange={(e) => { setFormData({ ...formData, companyName: e.target.value }); setValidationErrors({...validationErrors, companyName: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.companyName ? 'border-red-500' : ''}`}
              placeholder="Enter company name"
              required
            />
            {validationErrors.companyName && <p className="text-red-500 text-xs mt-1">{validationErrors.companyName}</p>}
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
            </select>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">GST Number</label>
            <input
              type="text"
              value={formData.gstNumber}
              onChange={(e) => { setFormData({ ...formData, gstNumber: formatGST(e.target.value) }); setValidationErrors({...validationErrors, gstNumber: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.gstNumber ? 'border-red-500' : ''}`}
              placeholder="e.g., 22AAAAA0000A1Z5"
              maxLength={15}
            />
            {validationErrors.gstNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.gstNumber}</p>}
            <p className="text-text-muted text-xs mt-1">Format: 22AAAAA0000A1Z5</p>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">PAN Number</label>
            <input
              type="text"
              value={formData.panNumber}
              onChange={(e) => { setFormData({ ...formData, panNumber: formatPAN(e.target.value) }); setValidationErrors({...validationErrors, panNumber: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.panNumber ? 'border-red-500' : ''}`}
              placeholder="e.g., ABCDE1234F"
              maxLength={10}
            />
            {validationErrors.panNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.panNumber}</p>}
            <p className="text-text-muted text-xs mt-1">Format: ABCDE1234F</p>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Location Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., India"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">State</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="input w-full px-4 py-2.5"
            >
              <option value="">Select State</option>
              {indianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., Mumbai"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">PIN Code</label>
            <input
              type="text"
              value={formData.pinCode}
              onChange={(e) => { setFormData({ ...formData, pinCode: formatPincode(e.target.value) }); setValidationErrors({...validationErrors, pinCode: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.pinCode ? 'border-red-500' : ''}`}
              placeholder="e.g., 400001"
              maxLength={6}
            />
            {validationErrors.pinCode && <p className="text-red-500 text-xs mt-1">{validationErrors.pinCode}</p>}
            <p className="text-text-muted text-xs mt-1">6 digits only</p>
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
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Contact Person</label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="Contact person name"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., Purchase Manager"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => { setFormData({ ...formData, phone: formatPhone(e.target.value) }); setValidationErrors({...validationErrors, phone: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.phone ? 'border-red-500' : ''}`}
              placeholder="e.g., 9876543210"
              maxLength={10}
            />
            {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
            <p className="text-text-muted text-xs mt-1">10 digits only</p>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Mobile</label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => { setFormData({ ...formData, mobile: formatPhone(e.target.value) }); setValidationErrors({...validationErrors, mobile: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.mobile ? 'border-red-500' : ''}`}
              placeholder="e.g., 9876543210"
              maxLength={10}
            />
            {validationErrors.mobile && <p className="text-red-500 text-xs mt-1">{validationErrors.mobile}</p>}
            <p className="text-text-muted text-xs mt-1">10 digits only</p>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setValidationErrors({...validationErrors, email: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.email ? 'border-red-500' : ''}`}
              placeholder="company@example.com"
            />
            {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => { setFormData({ ...formData, website: e.target.value }); setValidationErrors({...validationErrors, website: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.website ? 'border-red-500' : ''}`}
              placeholder="https://www.example.com"
            />
            {validationErrors.website && <p className="text-red-500 text-xs mt-1">{validationErrors.website}</p>}
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Payment Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Credit Limit</label>
            <input
              type="text"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., ₹5,00,000"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Additional Notes
        </h4>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="input w-full px-4 py-2.5 min-h-[100px] resize-y"
          placeholder="Any additional notes about this customer..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
              setEditingCustomer(null);
            } else {
              setShowAddModal(false);
            }
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
            <span>{isEdit ? 'Update Customer' : 'Add Customer'}</span>
          )}
        </button>
      </div>
    </form>
  );

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
    <div className="container-card w-full p-5 md:p-8 animate-fadeIn">
      <Header title="Customers" />

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
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All States</option>
          {uniqueStates.map(state => (
            <option key={state} value={state}>{state}</option>
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
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">S.No</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Company</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Contact</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Location</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">GST</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Payment Terms</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Status</th>
                <th className="px-3 py-4 text-right text-cream font-semibold text-xs whitespace-nowrap sticky right-0 bg-maroon">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-3 py-4"><div className="h-4 w-20 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-32 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-32 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-28 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-20 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-6 w-16 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-24 skeleton ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16">
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <h3 className="text-lg font-medium text-text-dark mb-1">No customers found</h3>
                      <p className="text-text-muted">
                        {(filterState !== 'all' || filterStatus !== 'all') ? 'Try adjusting your filters' : 'Add your first customer to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr 
                    key={customer.id} 
                    className="table-row animate-fadeIn"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-700 text-sm font-bold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div>
                        <div className="font-medium text-text-dark text-sm">{customer.Company_Name}</div>
                        {customer.Contact_Person && (
                          <div className="text-text-muted text-xs">{customer.Contact_Person}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        {(customer.Mobile || customer.Phone) && (
                          <div className="flex items-center gap-1 text-text-dark text-xs">
                            <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{customer.Mobile || customer.Phone}</span>
                          </div>
                        )}
                        {customer.Email && (
                          <div className="flex items-center gap-1 text-text-muted text-xs">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{customer.Email}</span>
                          </div>
                        )}
                        {!customer.Mobile && !customer.Phone && !customer.Email && <span className="text-text-muted text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1 text-text-muted text-sm">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <div className="text-text-dark font-medium">{customer.City || '-'}</div>
                          {customer.State && <div className="text-text-muted text-xs">{customer.State}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {customer.GST_Number ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">
                          {customer.GST_Number}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-text-dark text-sm">
                      {customer.Payment_Terms || '-'}
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.Status)}`}>
                        {customer.Status || 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-4 sticky right-0 bg-white">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(customer)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(customer)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          Edit
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
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
                Add New Customer
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
            {renderForm(handleAddCustomer, false)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                Edit Customer
              </h3>
              <button
                onClick={() => { setShowEditModal(false); setEditingCustomer(null); resetForm(); }}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderForm(handleEditCustomer, true)}
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCustomer && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-dark">{viewingCustomer.Company_Name}</h2>
                  <p className="text-text-muted text-sm">{viewingCustomer.Customer_ID}</p>
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
              {/* Company Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">GST Number</p>
                    <p className="text-sm font-medium text-text-dark font-mono">{viewingCustomer.GST_Number || '-'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PAN Number</p>
                    <p className="text-sm font-medium text-text-dark font-mono">{viewingCustomer.PAN_Number || '-'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingCustomer.Status)}`}>
                      {viewingCustomer.Status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">City</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.City || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">State</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.State || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Country</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Country || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PIN Code</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.PIN_Code || '-'}</p>
                  </div>
                  <div className="col-span-2 bg-white/50 rounded-lg p-3 border border-green-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Person</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Contact_Person || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Designation</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Designation || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Phone || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mobile</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Mobile || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Email || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Website</p>
                    {viewingCustomer.Website ? (
                      <a href={viewingCustomer.Website.startsWith('http') ? viewingCustomer.Website : `https://${viewingCustomer.Website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-maroon hover:underline">
                        {viewingCustomer.Website}
                      </a>
                    ) : <p className="text-sm font-medium text-text-dark">-</p>}
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Payment Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Payment Terms</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Payment_Terms || '-'}</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 border border-purple-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Credit Limit</p>
                    <p className="text-sm font-medium text-text-dark">{viewingCustomer.Credit_Limit || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingCustomer.Notes && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-text-dark mb-3">Notes</h3>
                  <p className="text-sm text-text-dark whitespace-pre-wrap">{viewingCustomer.Notes}</p>
                </div>
              )}
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
                  openEditModal(viewingCustomer);
                }}
                className="flex-1 btn-primary py-3 rounded-xl font-medium"
              >
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
