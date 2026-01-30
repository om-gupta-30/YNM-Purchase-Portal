'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

interface Order {
  id: number;
  order_id: string;
  vendor_type: string;
  vendor_id: number;
  vendor_name: string;
  order_type: string;
  product_type: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  special_instructions: string;
  order_purpose: string;
  consumption_location: string;
  customer_id: number;
  customer_po_number: string;
  customer_email: string;
  date_of_issue: string;
  tentative_dispatch_date: string;
  status: string;
  po_shared_with_vendor: boolean;
  dispatch_date: string;
  transporter_name: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  lr_docket_number: string;
  num_packages: number;
  total_weight: string;
  dispatch_notes: string;
  created_at: string;
}

const statusOptions = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_dispatch',
  'dispatched',
  'delivered',
  'cancelled'
];

export default function OrdersListPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const authFetch = useAuthFetch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPurpose, setFilterPurpose] = useState('all');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dispatch form
  const [dispatchForm, setDispatchForm] = useState({
    dispatchDate: new Date().toISOString().split('T')[0],
    sentThrough: '', // Road, Rail, Air, Sea, Courier
    transporterName: '',
    lorryNumber: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    lrDocketNumber: '',
    ewayBillNumber: '',
    invoiceNumber: '',
    numPackages: 0,
    totalWeight: '',
    freightCharges: '',
    freightPaidBy: '', // Sender, Receiver, To Pay
    dispatchNotes: ''
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await authFetch('/api/orders-new');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setOrders(data);
        setFilteredOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // Filter orders
  const uniqueStatuses = [...new Set(orders.map(o => o.status).filter(Boolean))].sort();
  const uniquePurposes = [...new Set(orders.map(o => o.order_purpose).filter(Boolean))].sort();

  useEffect(() => {
    let filtered = orders;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    if (filterPurpose !== 'all') {
      filtered = filtered.filter(order => order.order_purpose === filterPurpose);
    }
    
    setFilteredOrders(filtered);
  }, [filterStatus, filterPurpose, orders]);

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

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    if (newStatus === 'dispatched') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowDispatchModal(true);
      }
      return;
    }

    try {
      const res = await authFetch(`/api/orders-new/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setSuccess('Order status updated successfully!');
      fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handlePoSharedChange = async (orderId: number, shared: boolean) => {
    try {
      const res = await authFetch(`/api/orders-new/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ poSharedWithVendor: shared }),
      });

      if (!res.ok) {
        throw new Error('Failed to update');
      }

      fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/orders-new/${selectedOrder.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'dispatched',
          ...dispatchForm
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update dispatch details');
      }

      setSuccess('Order dispatched successfully!');
      setShowDispatchModal(false);
      setSelectedOrder(null);
      setDispatchForm({
        dispatchDate: new Date().toISOString().split('T')[0],
        sentThrough: '',
        transporterName: '',
        lorryNumber: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        lrDocketNumber: '',
        ewayBillNumber: '',
        invoiceNumber: '',
        numPackages: 0,
        totalWeight: '',
        freightCharges: '',
        freightPaidBy: '',
        dispatchNotes: ''
      });
      fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'ready_for_dispatch': return 'bg-orange-100 text-orange-800';
      case 'dispatched': return 'bg-teal-100 text-teal-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDispatch = (date: string) => {
    if (!date) return null;
    const dispatchDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dispatchDate.setHours(0, 0, 0, 0);
    const diffTime = dispatchDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
    <div className="container-card w-full p-5 md:p-8 animate-fadeIn">
      <Header title="Orders" />

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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Status</option>
          {uniqueStatuses.map(status => (
            <option key={status} value={status}>{status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}</option>
          ))}
        </select>
        <select
          value={filterPurpose}
          onChange={(e) => setFilterPurpose(e.target.value)}
          className="input px-4 py-3"
        >
          <option value="all">All Purposes</option>
          {uniquePurposes.map(purpose => (
            <option key={purpose} value={purpose}>{purpose.replace('_', ' ').charAt(0).toUpperCase() + purpose.replace('_', ' ').slice(1)}</option>
          ))}
        </select>
        <div className="flex-1"></div>
        {user?.role === 'employee' && (
          <button
            onClick={() => router.push('/orders-create')}
            className="btn-primary px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Order</span>
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead className="table-header">
              <tr>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Order ID</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Vendor</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Product</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Amount</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Purpose</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">Dispatch Date</th>
                <th className="px-3 py-4 text-left text-cream font-semibold text-xs whitespace-nowrap">PO Shared</th>
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
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-20 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-20 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-24 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-4 w-16 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-6 w-20 skeleton"></div></td>
                    <td className="px-3 py-4"><div className="h-8 w-24 skeleton ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16">
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <h3 className="text-lg font-medium text-text-dark mb-1">No orders found</h3>
                      <p className="text-text-muted">
                        {(filterStatus !== 'all' || filterPurpose !== 'all') ? 'Try adjusting your filters' : 'Create your first order to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => {
                  const daysUntil = getDaysUntilDispatch(order.tentative_dispatch_date);
                  const isUrgent = daysUntil !== null && daysUntil <= 5 && daysUntil >= 0 && order.status !== 'dispatched' && order.status !== 'delivered' && order.status !== 'cancelled';
                  
                  return (
                    <tr 
                      key={order.id} 
                      className={`table-row animate-fadeIn ${isUrgent ? 'bg-orange-50' : ''}`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-3 py-4">
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                            {order.order_id}
                          </span>
                          {order.customer_po_number && (
                            <div className="text-xs text-text-muted mt-1">PO: {order.customer_po_number}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div>
                          <div className="font-medium text-text-dark text-sm">{order.vendor_name}</div>
                          <div className="text-xs text-text-muted capitalize">{order.vendor_type}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div>
                          <div className="text-text-dark text-sm">{order.product_type}</div>
                          <div className="text-xs text-text-muted">{order.quantity} {order.unit}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-text-dark">
                          ₹{(order.total_amount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="text-sm text-text-dark capitalize">
                          {order.order_purpose?.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div>
                          <div className="text-sm text-text-dark">
                            {order.tentative_dispatch_date ? new Date(order.tentative_dispatch_date).toLocaleDateString('en-IN') : '-'}
                          </div>
                          {isUrgent && (
                            <div className="text-xs text-orange-600 font-medium">
                              {daysUntil === 0 ? 'Today!' : `${daysUntil} days left`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {user?.role === 'employee' ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={order.po_shared_with_vendor || false}
                              onChange={(e) => handlePoSharedChange(order.id, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-xs text-text-muted">
                              {order.po_shared_with_vendor ? 'Yes' : 'No'}
                            </span>
                          </label>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${order.po_shared_with_vendor ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {order.po_shared_with_vendor ? 'Yes' : 'No'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {user?.role === 'employee' ? (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer ${getStatusColor(order.status)}`}
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 sticky right-0 bg-white">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'dispatched' && order.customer_email && (
                            <button
                              onClick={() => alert('Email feature coming soon!')}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
                              title="Send email to customer"
                            >
                              Email
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={async () => {
                                if (confirm('Delete this order?')) {
                                  await authFetch(`/api/orders-new/${order.id}`, { method: 'DELETE' });
                                  fetchOrders();
                                }
                              }}
                              className="btn-danger px-3 py-1.5 rounded-lg text-xs font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Details Modal */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setShowDispatchModal(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                Dispatch Details
              </h3>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-muted hover:text-text-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-xl">
              <div className="text-sm text-blue-800">
                <strong>Order:</strong> {selectedOrder.order_id} • <strong>Vendor:</strong> {selectedOrder.vendor_name}
              </div>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-text-dark mb-3 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Dispatch Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Dispatch Date *</label>
                    <input
                      type="date"
                      value={dispatchForm.dispatchDate}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchDate: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Sent Through *</label>
                    <select
                      value={dispatchForm.sentThrough}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, sentThrough: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      required
                    >
                      <option value="">Select Mode</option>
                      <option value="Road">Road (Truck/Lorry)</option>
                      <option value="Rail">Rail (Train)</option>
                      <option value="Air">Air (Flight)</option>
                      <option value="Sea">Sea (Ship)</option>
                      <option value="Courier">Courier</option>
                      <option value="Hand Delivery">Hand Delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Invoice Number</label>
                    <input
                      type="text"
                      value={dispatchForm.invoiceNumber}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, invoiceNumber: e.target.value.toUpperCase() })}
                      className="input w-full px-4 py-2.5"
                      placeholder="INV-00001"
                    />
                  </div>
                </div>
              </div>

              {/* Transport Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-text-dark mb-3 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Transport Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Transporter Name</label>
                    <input
                      type="text"
                      value={dispatchForm.transporterName}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, transporterName: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="Enter transporter/courier name"
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">LR/Docket/AWB Number</label>
                    <input
                      type="text"
                      value={dispatchForm.lrDocketNumber}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, lrDocketNumber: e.target.value.toUpperCase() })}
                      className="input w-full px-4 py-2.5"
                      placeholder="Lorry Receipt / Docket / Air Waybill"
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Lorry/Truck Number</label>
                    <input
                      type="text"
                      value={dispatchForm.lorryNumber}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, lorryNumber: e.target.value.toUpperCase() })}
                      className="input w-full px-4 py-2.5"
                      placeholder="e.g., MH12AB1234"
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Vehicle Number (if different)</label>
                    <input
                      type="text"
                      value={dispatchForm.vehicleNumber}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, vehicleNumber: e.target.value.toUpperCase() })}
                      className="input w-full px-4 py-2.5"
                      placeholder="Container/Trailer number"
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">E-Way Bill Number</label>
                    <input
                      type="text"
                      value={dispatchForm.ewayBillNumber}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, ewayBillNumber: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="12 digit E-Way Bill number"
                      maxLength={12}
                    />
                  </div>
                </div>
              </div>

              {/* Driver Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-text-dark mb-3 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Driver Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Driver Name</label>
                    <input
                      type="text"
                      value={dispatchForm.driverName}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, driverName: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="Enter driver name"
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Driver Phone</label>
                    <input
                      type="tel"
                      value={dispatchForm.driverPhone}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, driverPhone: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Package & Freight Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-text-dark mb-3 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Package & Freight Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">No. of Packages</label>
                    <input
                      type="number"
                      value={dispatchForm.numPackages || ''}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, numPackages: parseInt(e.target.value) || 0 })}
                      className="input w-full px-4 py-2.5"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Total Weight</label>
                    <input
                      type="text"
                      value={dispatchForm.totalWeight}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, totalWeight: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="e.g., 500 kg"
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Freight Charges (₹)</label>
                    <input
                      type="text"
                      value={dispatchForm.freightCharges}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, freightCharges: e.target.value })}
                      className="input w-full px-4 py-2.5"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-text-dark font-medium mb-1.5 text-sm">Freight Paid By</label>
                    <select
                      value={dispatchForm.freightPaidBy}
                      onChange={(e) => setDispatchForm({ ...dispatchForm, freightPaidBy: e.target.value })}
                      className="input w-full px-4 py-2.5"
                    >
                      <option value="">Select</option>
                      <option value="Sender">Sender (Prepaid)</option>
                      <option value="Receiver">Receiver</option>
                      <option value="To Pay">To Pay</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-text-dark font-medium mb-1.5 text-sm">Dispatch Notes</label>
                <textarea
                  value={dispatchForm.dispatchNotes}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, dispatchNotes: e.target.value })}
                  className="input w-full px-4 py-2.5 min-h-[80px] resize-y"
                  placeholder="Any additional notes, special handling instructions..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
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
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <span>Mark as Dispatched</span>
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
