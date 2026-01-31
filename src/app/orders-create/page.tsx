'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

interface Vendor {
  id: number;
  name: string;
  type: 'manufacturer' | 'importer' | 'dealer';
  location: string;
  products: string[];
  contact: string;
  email: string;
}

interface Customer {
  id: number;
  Customer_ID: string;
  Company_Name: string;
  Contact_Person: string;
  Email: string;
  Phone: string;
  Mobile: string;
  City: string;
  State: string;
}

interface Product {
  id: number;
  Sub_Type: string;
}

type OrderType = 'bulk' | 'normal' | 'retail';
type OrderPurpose = 'factory' | 'supply' | 'self_consumption';
type ConsumptionLocation = 'factory' | 'site' | 'office' | 'warehouse' | 'other';

export default function OrdersCreatePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const authFetch = useAuthFetch();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Filters
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [orderType, setOrderType] = useState<OrderType>('bulk');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Step 2: Order Details
  const [productType, setProductType] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('pcs');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Step 3: Order Purpose
  const [orderPurpose, setOrderPurpose] = useState<OrderPurpose>('factory');
  const [consumptionLocation, setConsumptionLocation] = useState<ConsumptionLocation>('factory');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Step 4: Dates
  const [dateOfIssue, setDateOfIssue] = useState(new Date().toISOString().split('T')[0]);
  const [tentativeDispatchDate, setTentativeDispatchDate] = useState('');

  // Computed values
  const totalAmount = quantity * unitPrice;
  const uniqueLocations = [...new Set(vendors.map(v => v.location).filter(Boolean))].sort();
  const uniqueProductTypes = [...new Set(products.map(p => p.Sub_Type).filter(Boolean))].sort();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      
      // Fetch all data sources
      const [manufacturersRes, importersRes, dealersRes, customersRes, productsRes] = await Promise.all([
        authFetch('/api/manufacturers'),
        authFetch('/api/importers'),
        authFetch('/api/dealers'),
        authFetch('/api/customers'),
        authFetch('/api/products')
      ]);

      const manufacturersData = await manufacturersRes.json();
      const importersData = await importersRes.json();
      const dealersData = await dealersRes.json();
      const customersData = await customersRes.json();
      const productsData = await productsRes.json();

      // Transform manufacturers
      const manufacturerVendors: Vendor[] = (manufacturersData || []).map((m: Record<string, unknown>) => ({
        id: m.id,
        name: m.Manufacturer_Name,
        type: 'manufacturer' as const,
        location: m.Location || '',
        products: (m.productsOffered as Array<{productType: string}> || []).map(p => p.productType),
        contact: m.Contact_Number || '',
        email: m.Email || ''
      }));

      // Transform importers
      const importerVendors: Vendor[] = (importersData || []).map((i: Record<string, unknown>) => ({
        id: i.id,
        name: i.Company_Name,
        type: 'importer' as const,
        location: `${i.City || ''}, ${i.Country || ''}`.replace(/^, |, $/g, ''),
        products: (i.productsOffered as Array<{productType: string}> || []).map(p => p.productType),
        contact: i.Phone || '',
        email: i.Email || ''
      }));

      // Transform dealers
      const dealerVendors: Vendor[] = (dealersData || []).map((d: Record<string, unknown>) => ({
        id: d.id,
        name: d.Company_Name,
        type: 'dealer' as const,
        location: `${d.City || ''}, ${d.State || ''}`.replace(/^, |, $/g, ''),
        products: (d.productsOffered as Array<{productType: string}> || []).map(p => p.productType),
        contact: d.Mobile || d.Phone || '',
        email: d.Email || ''
      }));

      setVendors([...manufacturerVendors, ...importerVendors, ...dealerVendors]);
      setCustomers(customersData || []);
      setProducts(productsData || []);
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

  // Filter vendors based on selections
  useEffect(() => {
    let filtered = vendors;

    // Filter by order type
    if (orderType === 'retail') {
      // Show all: manufacturers, importers, dealers
    } else {
      // Bulk/Normal: Only manufacturers and importers
      filtered = filtered.filter(v => v.type === 'manufacturer' || v.type === 'importer');
    }

    // Filter by location
    if (filterLocation !== 'all') {
      filtered = filtered.filter(v => v.location.toLowerCase().includes(filterLocation.toLowerCase()));
    }

    // Filter by product
    if (filterProduct !== 'all') {
      filtered = filtered.filter(v => v.products.includes(filterProduct));
    }

    setFilteredVendors(filtered);
  }, [vendors, orderType, filterLocation, filterProduct]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const orderData = {
        vendorType: selectedVendor?.type,
        vendorId: selectedVendor?.id,
        vendorName: selectedVendor?.name,
        orderType,
        productType,
        quantity,
        unit,
        unitPrice,
        totalAmount,
        specialInstructions,
        orderPurpose,
        consumptionLocation: orderPurpose === 'self_consumption' ? consumptionLocation : null,
        customerId: orderPurpose === 'supply' ? selectedCustomer?.id : null,
        customerEmail: orderPurpose === 'supply' ? selectedCustomer?.Email : null,
        dateOfIssue,
        tentativeDispatchDate
      };

      const res = await authFetch('/api/orders-new', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      setSuccess(`Order ${data.order_id} created successfully!${data.customer_po_number ? ` Customer PO: ${data.customer_po_number}` : ''}`);
      
      // Redirect to orders list after 2 seconds
      setTimeout(() => {
        router.push('/orders-list');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 1:
        return selectedVendor !== null;
      case 2:
        return productType && quantity > 0 && unitPrice >= 0;
      case 3:
        if (orderPurpose === 'supply') return selectedCustomer !== null;
        if (orderPurpose === 'self_consumption') return !!consumptionLocation;
        return true;
      case 4:
        return tentativeDispatchDate !== '';
      default:
        return true;
    }
  };

  const getVendorTypeColor = (type: string) => {
    switch (type) {
      case 'manufacturer': return 'bg-purple-100 text-purple-800';
      case 'importer': return 'bg-teal-100 text-teal-800';
      case 'dealer': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
              currentStep === step
                ? 'bg-primary text-white'
                : currentStep > step
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {currentStep > step ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step
            )}
          </div>
          {step < 5 && (
            <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text-dark">Select Vendor</h2>
        <p className="text-text-muted">Choose order type and filter vendors</p>
      </div>

      {/* Order Type Selection */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4">Order Type</h4>
        <div className="flex flex-wrap gap-4">
          {(['bulk', 'normal', 'retail'] as OrderType[]).map((type) => (
            <label
              key={type}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                orderType === type
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="orderType"
                value={type}
                checked={orderType === type}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="w-4 h-4 text-primary"
              />
              <div>
                <div className="font-medium text-text-dark capitalize">{type}</div>
                <div className="text-xs text-text-muted">
                  {type === 'retail' 
                    ? 'Manufacturers, Importers & Dealers' 
                    : 'Manufacturers & Importers only'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4">Filters</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Location</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="input w-full px-4 py-2.5"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Product</label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="input w-full px-4 py-2.5"
            >
              <option value="all">All Products</option>
              {uniqueProductTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vendor List */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4">
          Available Vendors ({filteredVendors.length})
        </h4>
        <div className="max-h-[400px] overflow-y-auto space-y-3">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              No vendors found. Try adjusting your filters.
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <div
                key={`${vendor.type}-${vendor.id}`}
                onClick={() => setSelectedVendor(vendor)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedVendor?.id === vendor.id && selectedVendor?.type === vendor.type
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-text-dark">{vendor.name}</div>
                    <div className="text-sm text-text-muted">{vendor.location}</div>
                    {vendor.products.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {vendor.products.slice(0, 3).map((p, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                            {p}
                          </span>
                        ))}
                        {vendor.products.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                            +{vendor.products.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVendorTypeColor(vendor.type)}`}>
                    {vendor.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text-dark">Order Details</h2>
        <p className="text-text-muted">Fill in the product and quantity details</p>
      </div>

      {/* Selected Vendor Display */}
      {selectedVendor && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-text-dark">{selectedVendor.name}</div>
              <div className="text-sm text-text-muted">{selectedVendor.location} • {selectedVendor.type}</div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Form */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Product Type *</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="input w-full px-4 py-2.5"
              required
            >
              <option value="">Select Product</option>
              {uniqueProductTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input w-full px-4 py-2.5"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="m">Meters (m)</option>
              <option value="l">Liters (L)</option>
              <option value="box">Boxes</option>
              <option value="set">Sets</option>
            </select>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Quantity *</label>
            <input
              type="number"
              value={quantity || ''}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="input w-full px-4 py-2.5"
              placeholder="Enter quantity"
              min="0"
              required
            />
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Unit Price (₹)</label>
            <input
              type="number"
              value={unitPrice || ''}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="input w-full px-4 py-2.5"
              placeholder="Enter unit price"
              min="0"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-text-dark font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-primary">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-text-dark font-medium mb-1.5 text-sm">Special Instructions</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="input w-full px-4 py-2.5 min-h-[80px] resize-y"
            placeholder="Any special instructions or notes..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text-dark">Order Purpose</h2>
        <p className="text-text-muted">What is this order for?</p>
      </div>

      {/* Purpose Selection */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-text-dark mb-4">Select Purpose</h4>
        <div className="space-y-3">
          {[
            { value: 'factory', label: 'For Factory (Raw Materials)', desc: 'Materials for manufacturing' },
            { value: 'supply', label: 'For Supply', desc: 'Supply to a customer' },
            { value: 'self_consumption', label: 'For Self Consumption', desc: 'Internal use' }
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                orderPurpose === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="orderPurpose"
                value={option.value}
                checked={orderPurpose === option.value}
                onChange={(e) => setOrderPurpose(e.target.value as OrderPurpose)}
                className="w-5 h-5 text-primary"
              />
              <div>
                <div className="font-medium text-text-dark">{option.label}</div>
                <div className="text-sm text-text-muted">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Self Consumption Location */}
      {orderPurpose === 'self_consumption' && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-text-dark mb-4">Consumption Location</h4>
          <select
            value={consumptionLocation}
            onChange={(e) => setConsumptionLocation(e.target.value as ConsumptionLocation)}
            className="input w-full px-4 py-2.5"
          >
            <option value="factory">Factory</option>
            <option value="site">Site</option>
            <option value="office">Office</option>
            <option value="warehouse">Warehouse</option>
            <option value="other">Other</option>
          </select>
        </div>
      )}

      {/* Customer Selection for Supply */}
      {orderPurpose === 'supply' && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-text-dark mb-4">Select Customer</h4>
          <div className="max-h-[300px] overflow-y-auto space-y-3">
            {customers.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                No customers found. Please add customers first.
              </div>
            ) : (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCustomer?.id === customer.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="font-medium text-text-dark">{customer.Company_Name}</div>
                  <div className="text-sm text-text-muted">
                    {customer.Contact_Person} • {customer.City}, {customer.State}
                  </div>
                  {customer.Email && (
                    <div className="text-xs text-text-muted mt-1">{customer.Email}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {selectedCustomer && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="text-sm text-green-800">
                <strong>PO Number will be auto-generated</strong> for this customer upon order creation.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text-dark">Set Dates</h2>
        <p className="text-text-muted">Issue date and expected dispatch date</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Date of Issue</label>
            <input
              type="date"
              value={dateOfIssue}
              onChange={(e) => setDateOfIssue(e.target.value)}
              className="input w-full px-4 py-2.5"
            />
            <p className="text-xs text-text-muted mt-1">Auto-filled with today&apos;s date</p>
          </div>
          <div>
            <label className="block text-text-dark font-medium mb-1.5 text-sm">Tentative Dispatch Date *</label>
            <input
              type="date"
              value={tentativeDispatchDate}
              onChange={(e) => setTentativeDispatchDate(e.target.value)}
              className="input w-full px-4 py-2.5"
              min={dateOfIssue}
              required
            />
            <p className="text-xs text-text-muted mt-1">Expected date for dispatch</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text-dark">Review & Confirm</h2>
        <p className="text-text-muted">Please review all details before submitting</p>
      </div>

      <div className="space-y-4">
        {/* Vendor Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Vendor
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-text-muted">Name:</div>
            <div className="text-text-dark font-medium">{selectedVendor?.name}</div>
            <div className="text-text-muted">Type:</div>
            <div className="text-text-dark capitalize">{selectedVendor?.type}</div>
            <div className="text-text-muted">Order Type:</div>
            <div className="text-text-dark capitalize">{orderType}</div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Order Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-text-muted">Product:</div>
            <div className="text-text-dark font-medium">{productType}</div>
            <div className="text-text-muted">Quantity:</div>
            <div className="text-text-dark">{quantity} {unit}</div>
            <div className="text-text-muted">Unit Price:</div>
            <div className="text-text-dark">₹{unitPrice.toLocaleString('en-IN')}</div>
            <div className="text-text-muted">Total Amount:</div>
            <div className="text-text-dark font-bold text-primary">₹{totalAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Purpose */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Purpose
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-text-muted">Purpose:</div>
            <div className="text-text-dark capitalize">{orderPurpose.replace('_', ' ')}</div>
            {orderPurpose === 'self_consumption' && (
              <>
                <div className="text-text-muted">Location:</div>
                <div className="text-text-dark capitalize">{consumptionLocation}</div>
              </>
            )}
            {orderPurpose === 'supply' && selectedCustomer && (
              <>
                <div className="text-text-muted">Customer:</div>
                <div className="text-text-dark">{selectedCustomer.Company_Name}</div>
              </>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Dates
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-text-muted">Date of Issue:</div>
            <div className="text-text-dark">{new Date(dateOfIssue).toLocaleDateString('en-IN')}</div>
            <div className="text-text-muted">Tentative Dispatch:</div>
            <div className="text-text-dark">{new Date(tentativeDispatchDate).toLocaleDateString('en-IN')}</div>
          </div>
        </div>
      </div>
    </div>
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
      <Header title="Create Order" />

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

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner-lg"></div>
          </div>
        ) : (
          <>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 text-text-dark"
          >
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={!canProceedToStep(currentStep)}
              className="btn-primary px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary px-8 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-sm"></div>
                  <span>Creating Order...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create Order</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
