'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { validators, formatPhone, formatGST, formatPAN, formatPincode, formatIFSC, formatBankAccount } from '@/utils/validation';

interface ProductOffered {
  productType: string;
  price: number;
}

interface Product {
  id: number;
  Sub_Type: string;
}

interface Dealer {
  id: number;
  Dealer_ID: string;
  // Company Information
  Company_Name: string;
  Business_Type: string; // Dealer, Stockist, Distributor
  GST_Number: string;
  PAN_Number: string;
  Establishment_Year: string;
  Status: string;
  // Location Details
  Country: string;
  State: string;
  City: string;
  Address: string;
  PIN_Code: string;
  Territory_Covered: string;
  // Contact Information
  Phone: string;
  Mobile: string;
  Email: string;
  Website: string;
  // Contact Person
  Contact_Person_Name: string;
  Contact_Person_Designation: string;
  Contact_Person_Phone: string;
  Contact_Person_Email: string;
  // Business Details
  Products_Dealing: string;
  productsOffered: ProductOffered[];
  Brands_Handled: string;
  Annual_Turnover: string;
  Employee_Count: string;
  Warehouse_Area: string;
  Fleet_Size: string;
  Credit_Limit: string;
  // Bank Details
  Bank_Name: string;
  Bank_Account_Number: string;
  Bank_IFSC: string;
  Payment_Terms: string;
  // Rating & Agreement
  Rating: number;
  Agreement_Start_Date: string;
  Agreement_End_Date: string;
}

export default function DealersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const authFetch = useAuthFetch();
  
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [filteredDealers, setFilteredDealers] = useState<Dealer[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [viewingDealer, setViewingDealer] = useState<Dealer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    companyName: '',
    businessType: 'Dealer',
    gstNumber: '',
    panNumber: '',
    establishmentYear: '',
    status: 'active',
    country: 'India',
    state: '',
    city: '',
    address: '',
    pinCode: '',
    territoryCovered: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    productsOffered: [{ productType: '', price: 0 }] as ProductOffered[],
    brandsHandled: '',
    annualTurnover: '',
    employeeCount: '',
    warehouseArea: '',
    fleetSize: '',
    creditLimit: '',
    bankName: '',
    bankAccountNumber: '',
    bankIFSC: '',
    paymentTerms: '',
    rating: 0,
    agreementStartDate: '',
    agreementEndDate: '',
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
    if (formData.mobile) {
      const mobileResult = validators.phone(formData.mobile);
      if (!mobileResult.valid) errors.mobile = mobileResult.message;
    }
    if (formData.contactPersonPhone) {
      const cpPhoneResult = validators.phone(formData.contactPersonPhone);
      if (!cpPhoneResult.valid) errors.contactPersonPhone = cpPhoneResult.message;
    }
    
    // Email validation
    if (formData.email) {
      const emailResult = validators.email(formData.email);
      if (!emailResult.valid) errors.email = emailResult.message;
    }
    if (formData.contactPersonEmail) {
      const cpEmailResult = validators.email(formData.contactPersonEmail);
      if (!cpEmailResult.valid) errors.contactPersonEmail = cpEmailResult.message;
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
    
    // IFSC validation
    if (formData.bankIFSC) {
      const ifscResult = validators.ifsc(formData.bankIFSC);
      if (!ifscResult.valid) errors.bankIFSC = ifscResult.message;
    }
    
    // Bank account validation
    if (formData.bankAccountNumber) {
      const bankResult = validators.bankAccount(formData.bankAccountNumber);
      if (!bankResult.valid) errors.bankAccountNumber = bankResult.message;
    }
    
    // Website validation
    if (formData.website) {
      const websiteResult = validators.website(formData.website);
      if (!websiteResult.valid) errors.website = websiteResult.message;
    }
    
    // Year validation
    if (formData.establishmentYear) {
      const yearResult = validators.year(formData.establishmentYear);
      if (!yearResult.valid) errors.establishmentYear = yearResult.message;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch dealers
  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [dealersRes, productsRes] = await Promise.all([
        authFetch('/api/dealers'),
        authFetch('/api/products')
      ]);
      
      if (dealersRes.ok) {
        const data = await dealersRes.json();
        setDealers(Array.isArray(data) ? data : []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching dealers:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Get unique values for filters
  const uniqueStates = [...new Set(dealers.map(d => d.State).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(dealers.map(d => d.Status).filter(Boolean))].sort();

  // Filter dealers
  useEffect(() => {
    let filtered = dealers;
    
    // Filter by business type
    if (filterType !== 'all') {
      filtered = filtered.filter(dealer => dealer.Business_Type === filterType);
    }
    
    // Filter by state
    if (filterState !== 'all') {
      filtered = filtered.filter(dealer => dealer.State === filterState);
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(dealer => dealer.Status === filterStatus);
    }
    
    setFilteredDealers(filtered);
  }, [dealers, filterType, filterState, filterStatus]);

  // Auto-hide messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const resetForm = () => {
    setFormData({
      companyName: '',
      businessType: 'Dealer',
      gstNumber: '',
      panNumber: '',
      establishmentYear: '',
      status: 'active',
      country: 'India',
      state: '',
      city: '',
      address: '',
      pinCode: '',
      territoryCovered: '',
      phone: '',
      mobile: '',
      email: '',
      website: '',
      contactPersonName: '',
      contactPersonDesignation: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      productsOffered: [{ productType: '', price: 0 }],
      brandsHandled: '',
      annualTurnover: '',
      employeeCount: '',
      warehouseArea: '',
      fleetSize: '',
      creditLimit: '',
      bankName: '',
      bankAccountNumber: '',
      bankIFSC: '',
      paymentTerms: '',
      rating: 0,
      agreementStartDate: '',
      agreementEndDate: '',
    });
  };

  const handleAddDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch('/api/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Dealer added successfully!');
        setShowAddModal(false);
        resetForm();
        setValidationErrors({});
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add dealer');
      }
    } catch {
      setError('Failed to add dealer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealer) return;

    setError('');
    
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await authFetch(`/api/dealers/${editingDealer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Dealer updated successfully!');
        setShowEditModal(false);
        setEditingDealer(null);
        resetForm();
        setValidationErrors({});
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update dealer');
      }
    } catch {
      setError('Failed to update dealer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDealer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dealer?')) return;

    try {
      const response = await authFetch(`/api/dealers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Dealer deleted successfully!');
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete dealer');
      }
    } catch {
      setError('Failed to delete dealer');
    }
  };

  const openEditModal = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setFormData({
      companyName: dealer.Company_Name || '',
      businessType: dealer.Business_Type || 'Dealer',
      gstNumber: dealer.GST_Number || '',
      panNumber: dealer.PAN_Number || '',
      establishmentYear: dealer.Establishment_Year || '',
      status: dealer.Status || 'active',
      country: dealer.Country || 'India',
      state: dealer.State || '',
      city: dealer.City || '',
      address: dealer.Address || '',
      pinCode: dealer.PIN_Code || '',
      territoryCovered: dealer.Territory_Covered || '',
      phone: dealer.Phone || '',
      mobile: dealer.Mobile || '',
      email: dealer.Email || '',
      website: dealer.Website || '',
      contactPersonName: dealer.Contact_Person_Name || '',
      contactPersonDesignation: dealer.Contact_Person_Designation || '',
      contactPersonPhone: dealer.Contact_Person_Phone || '',
      contactPersonEmail: dealer.Contact_Person_Email || '',
      productsOffered: dealer.productsOffered?.length > 0 
        ? dealer.productsOffered 
        : [{ productType: '', price: 0 }],
      brandsHandled: dealer.Brands_Handled || '',
      annualTurnover: dealer.Annual_Turnover || '',
      employeeCount: dealer.Employee_Count || '',
      warehouseArea: dealer.Warehouse_Area || '',
      fleetSize: dealer.Fleet_Size || '',
      creditLimit: dealer.Credit_Limit || '',
      bankName: dealer.Bank_Name || '',
      bankAccountNumber: dealer.Bank_Account_Number || '',
      bankIFSC: dealer.Bank_IFSC || '',
      paymentTerms: dealer.Payment_Terms || '',
      rating: dealer.Rating || 0,
      agreementStartDate: dealer.Agreement_Start_Date || '',
      agreementEndDate: dealer.Agreement_End_Date || '',
    });
    setShowEditModal(true);
  };

  const openViewModal = (dealer: Dealer) => {
    setViewingDealer(dealer);
    setShowViewModal(true);
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

  const businessTypes = ['Dealer', 'Stockist', 'Distributor'];
  const paymentTermsList = ['Advance', 'COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'Credit'];
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
  ];

  const renderForm = (onSubmit: (e: React.FormEvent) => Promise<void>, isEdit: boolean) => (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Business Type *</label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="input w-full px-4 py-2.5"
              required
            >
              {businessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
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
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Establishment Year</label>
            <input
              type="number"
              value={formData.establishmentYear}
              onChange={(e) => { setFormData({ ...formData, establishmentYear: e.target.value }); setValidationErrors({...validationErrors, establishmentYear: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.establishmentYear ? 'border-red-500' : ''}`}
              placeholder="e.g., 2010"
              min="1900"
              max={new Date().getFullYear()}
            />
            {validationErrors.establishmentYear && <p className="text-red-500 text-xs mt-1">{validationErrors.establishmentYear}</p>}
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
              <option value="suspended">Suspended</option>
              <option value="pending">Pending Approval</option>
            </select>
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
            <label className="block text-text-dark font-medium mb-1.5 text-sm">State / Province</label>
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
            <label className="block text-text-dark font-medium mb-1.5 text-sm">PIN / ZIP Code</label>
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
          <div className="md:col-span-2">
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Territory / Region Covered</label>
            <input
              type="text"
              value={formData.territoryCovered}
              onChange={(e) => setFormData({ ...formData, territoryCovered: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., Western Maharashtra, Mumbai Region"
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

      {/* Contact Person */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              placeholder="e.g., Sales Manager, Owner"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Phone</label>
            <input
              type="tel"
              value={formData.contactPersonPhone}
              onChange={(e) => { setFormData({ ...formData, contactPersonPhone: formatPhone(e.target.value) }); setValidationErrors({...validationErrors, contactPersonPhone: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.contactPersonPhone ? 'border-red-500' : ''}`}
              placeholder="e.g., 9876543210"
              maxLength={10}
            />
            {validationErrors.contactPersonPhone && <p className="text-red-500 text-xs mt-1">{validationErrors.contactPersonPhone}</p>}
            <p className="text-text-muted text-xs mt-1">10 digits only</p>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Email</label>
            <input
              type="email"
              value={formData.contactPersonEmail}
              onChange={(e) => { setFormData({ ...formData, contactPersonEmail: e.target.value }); setValidationErrors({...validationErrors, contactPersonEmail: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.contactPersonEmail ? 'border-red-500' : ''}`}
              placeholder="person@example.com"
            />
            {validationErrors.contactPersonEmail && <p className="text-red-500 text-xs mt-1">{validationErrors.contactPersonEmail}</p>}
          </div>
        </div>
      </div>

      {/* Products & Prices */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-text-dark flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products & Prices
          </h4>
          <button
            type="button"
            onClick={addProductField}
            className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
        
        <div className="space-y-3 mb-4">
          {formData.productsOffered.map((product, index) => (
            <div key={index} className="flex gap-3 items-start p-3 bg-white rounded-xl border border-gray-200">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Brands Handled</label>
            <input
              type="text"
              value={formData.brandsHandled}
              onChange={(e) => setFormData({ ...formData, brandsHandled: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., YNM, Brand A, Brand B"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Annual Turnover</label>
            <input
              type="text"
              value={formData.annualTurnover}
              onChange={(e) => setFormData({ ...formData, annualTurnover: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., ₹50 Lakhs, ₹2 Crore"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Number of Employees</label>
            <input
              type="number"
              value={formData.employeeCount}
              onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., 25"
              min="0"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Warehouse Area (sq ft)</label>
            <input
              type="text"
              value={formData.warehouseArea}
              onChange={(e) => setFormData({ ...formData, warehouseArea: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., 5000"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Fleet Size (Vehicles)</label>
            <input
              type="number"
              value={formData.fleetSize}
              onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
              className="input w-full px-4 py-2.5"
              placeholder="e.g., 10"
              min="0"
            />
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

      {/* Bank & Payment Details */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              placeholder="e.g., HDFC Bank"
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Account Number</label>
            <input
              type="text"
              value={formData.bankAccountNumber}
              onChange={(e) => { setFormData({ ...formData, bankAccountNumber: formatBankAccount(e.target.value) }); setValidationErrors({...validationErrors, bankAccountNumber: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.bankAccountNumber ? 'border-red-500' : ''}`}
              placeholder="Enter account number"
              maxLength={18}
            />
            {validationErrors.bankAccountNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.bankAccountNumber}</p>}
            <p className="text-text-muted text-xs mt-1">9-18 digits</p>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">IFSC Code</label>
            <input
              type="text"
              value={formData.bankIFSC}
              onChange={(e) => { setFormData({ ...formData, bankIFSC: formatIFSC(e.target.value) }); setValidationErrors({...validationErrors, bankIFSC: ''}); }}
              className={`input w-full px-4 py-2.5 ${validationErrors.bankIFSC ? 'border-red-500' : ''}`}
              placeholder="e.g., HDFC0001234"
              maxLength={11}
            />
            {validationErrors.bankIFSC && <p className="text-red-500 text-xs mt-1">{validationErrors.bankIFSC}</p>}
            <p className="text-text-muted text-xs mt-1">Format: ABCD0123456</p>
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
            if (isEdit) {
              setShowEditModal(false);
              setEditingDealer(null);
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
            <span>{isEdit ? 'Update Dealer' : 'Add Dealer'}</span>
          )}
        </button>
      </div>
    </form>
  );

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get business type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Dealer': return 'bg-purple-100 text-purple-700';
      case 'Stockist': return 'bg-blue-100 text-blue-700';
      case 'Distributor': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (authLoading) {
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
      <Header title="Dealers / Stockists / Distributors" />

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
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Types</option>
          <option value="Dealer">Dealers</option>
          <option value="Stockist">Stockists</option>
          <option value="Distributor">Distributors</option>
        </select>
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
          <span>Add Dealer</span>
        </button>
      </div>

      {/* Dealers Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">S.No</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Company</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Type</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Location</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Territory</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Contact</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">GST</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Rating</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Status</th>
                <th className="px-3 py-4 text-right text-cream font-semibold text-xs whitespace-nowrap sticky right-0 bg-maroon">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-3 py-4"><div className="h-4 w-16 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-32 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-20 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-28 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-32 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-16 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-6 w-16 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-24 skeleton ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredDealers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16">
                    <div className="empty-state">
                      <div className="empty-state-icon">🤝</div>
                      <h3 className="text-lg font-medium text-text-dark mb-1">No dealers found</h3>
                      <p className="text-text-muted">
                        {(filterType !== 'all' || filterState !== 'all' || filterStatus !== 'all') ? 'Try adjusting your filters' : 'Add your first dealer to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDealers.map((dealer, index) => (
                  <tr 
                    key={dealer.id} 
                    className="table-row animate-fadeIn"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-bold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div>
                        <div className="font-medium text-text-dark text-sm">{dealer.Company_Name}</div>
                          {dealer.Contact_Person_Name && (
                          <div className="text-text-muted text-xs">{dealer.Contact_Person_Name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(dealer.Business_Type)}`}>
                        {dealer.Business_Type}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1 text-text-muted text-sm">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <div className="text-text-dark font-medium">{dealer.City || '-'}</div>
                          {dealer.State && <div className="text-text-muted text-xs">{dealer.State}, {dealer.Country}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-text-dark text-xs">{dealer.Territory_Covered || '-'}</td>
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        {(dealer.Mobile || dealer.Phone) && (
                          <div className="flex items-center gap-1 text-text-dark text-xs">
                            <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{dealer.Mobile || dealer.Phone}</span>
                          </div>
                        )}
                        {dealer.Email && (
                          <div className="flex items-center gap-1 text-text-muted text-xs">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{dealer.Email}</span>
                          </div>
                        )}
                        {!dealer.Mobile && !dealer.Phone && !dealer.Email && <span className="text-text-muted text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {dealer.GST_Number ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono">
                          {dealer.GST_Number}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-text-dark text-sm font-medium">{dealer.Rating || 0}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dealer.Status)}`}>
                        {dealer.Status || 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-4 sticky right-0 bg-white">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewModal(dealer)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(dealer)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        >
                          Edit
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteDealer(dealer.id)}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Add New Dealer
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
            {renderForm(handleAddDealer, false)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingDealer && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                Edit Dealer
              </h3>
              <button
                onClick={() => { setShowEditModal(false); setEditingDealer(null); resetForm(); }}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderForm(handleEditDealer, true)}
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingDealer && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-dark">{viewingDealer.Company_Name}</h2>
                  <div className="flex items-center gap-2">
                    <p className="text-text-muted text-sm">{viewingDealer.Dealer_ID}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(viewingDealer.Business_Type)}`}>
                      {viewingDealer.Business_Type}
                    </span>
                  </div>
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
                <h3 className="text-sm font-semibold text-text-dark mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">GST Number</p>
                    <p className="text-sm font-medium text-text-dark font-mono">{viewingDealer.GST_Number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">PAN Number</p>
                    <p className="text-sm font-medium text-text-dark font-mono">{viewingDealer.PAN_Number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Established</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Establishment_Year || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingDealer.Status)}`}>
                      {viewingDealer.Status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3">Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">City</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.City || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">State</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.State || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Country</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Country || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">PIN Code</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.PIN_Code || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-text-muted mb-1">Address</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Address || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-text-muted mb-1">Territory Covered</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Territory_Covered || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Phone</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Mobile</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Mobile || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Email</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Website</p>
                    {viewingDealer.Website ? (
                      <a href={viewingDealer.Website.startsWith('http') ? viewingDealer.Website : `https://${viewingDealer.Website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-maroon hover:underline">
                        {viewingDealer.Website}
                      </a>
                    ) : <p className="text-sm font-medium text-text-dark">-</p>}
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              {viewingDealer.Contact_Person_Name && (
                <div className="bg-orange-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-text-dark mb-3">Contact Person</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-muted mb-1">Name</p>
                      <p className="text-sm font-medium text-text-dark">{viewingDealer.Contact_Person_Name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Designation</p>
                      <p className="text-sm font-medium text-text-dark">{viewingDealer.Contact_Person_Designation || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Phone</p>
                      <p className="text-sm font-medium text-text-dark">{viewingDealer.Contact_Person_Phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted mb-1">Email</p>
                      <p className="text-sm font-medium text-text-dark">{viewingDealer.Contact_Person_Email || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Products & Prices */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3">Products & Prices</h3>
                {viewingDealer.productsOffered && viewingDealer.productsOffered.length > 0 && viewingDealer.productsOffered.some(p => p.productType) ? (
                  <div className="space-y-2">
                    {viewingDealer.productsOffered.filter(p => p.productType).map((product, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <p className="text-xs text-text-muted mb-0.5">Product Type</p>
                          <span className="text-sm font-medium text-text-dark">{product.productType}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted mb-0.5">Price</p>
                          <span className="text-sm font-bold text-purple-600">₹{product.price?.toLocaleString('en-IN') || '0'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No products listed</p>
                )}
              </div>

              {/* Business Details */}
              <div className="bg-indigo-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-dark mb-3">Business Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Annual Turnover</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Annual_Turnover || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Employees</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Employee_Count || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Warehouse Area</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Warehouse_Area || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Fleet Size</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Fleet_Size || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Credit Limit</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Credit_Limit || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium">{viewingDealer.Rating || 0}/5</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-text-muted mb-1">Brands Handled</p>
                    <p className="text-sm font-medium text-text-dark">{viewingDealer.Brands_Handled || '-'}</p>
                  </div>
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
                  openEditModal(viewingDealer);
                }}
                className="flex-1 btn-primary py-3 rounded-xl font-medium"
              >
                Edit Dealer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
