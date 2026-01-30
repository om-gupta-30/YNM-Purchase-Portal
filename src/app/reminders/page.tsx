'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

interface Order {
  id: number;
  order_id: string;
  vendor_name: string;
  vendor_type: string;
  product_type: string;
  quantity: number;
  unit: string;
  total_amount: number;
  order_purpose: string;
  customer_po_number: string;
  tentative_dispatch_date: string;
  status: string;
  po_shared_with_vendor: boolean;
}

type UrgencyFilter = 'all' | 'today' | 'tomorrow' | 'this_week';

export default function RemindersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const authFetch = useAuthFetch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [isLoadingData, setIsLoadingData] = useState(true);

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
        // Filter orders that are pending dispatch within 5 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const pendingOrders = data.filter((order: Order) => {
          if (!order.tentative_dispatch_date) return false;
          if (['dispatched', 'delivered', 'cancelled'].includes(order.status)) return false;
          
          const dispatchDate = new Date(order.tentative_dispatch_date);
          dispatchDate.setHours(0, 0, 0, 0);
          
          const diffTime = dispatchDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return diffDays <= 5 && diffDays >= -2; // Include overdue up to 2 days
        });

        // Sort by dispatch date
        pendingOrders.sort((a: Order, b: Order) => {
          return new Date(a.tentative_dispatch_date).getTime() - new Date(b.tentative_dispatch_date).getTime();
        });

        setOrders(pendingOrders);
        setFilteredOrders(pendingOrders);
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

  // Filter by urgency
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = orders;

    if (urgencyFilter !== 'all') {
      filtered = orders.filter(order => {
        const dispatchDate = new Date(order.tentative_dispatch_date);
        dispatchDate.setHours(0, 0, 0, 0);
        const diffTime = dispatchDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (urgencyFilter) {
          case 'today':
            return diffDays === 0;
          case 'tomorrow':
            return diffDays === 1;
          case 'this_week':
            return diffDays >= 0 && diffDays <= 7;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [urgencyFilter, orders]);

  const getDaysInfo = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dispatchDate = new Date(dateStr);
    dispatchDate.setHours(0, 0, 0, 0);
    const diffTime = dispatchDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`, color: 'text-red-600 bg-red-50', urgent: true };
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-orange-600 bg-orange-50', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-yellow-600 bg-yellow-50', urgent: true };
    } else {
      return { text: `${diffDays} days left`, color: 'text-blue-600 bg-blue-50', urgent: false };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'ready_for_dispatch': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats
  const todayCount = orders.filter(o => getDaysInfo(o.tentative_dispatch_date).text === 'Today').length;
  const tomorrowCount = orders.filter(o => getDaysInfo(o.tentative_dispatch_date).text === 'Tomorrow').length;
  const overdueCount = orders.filter(o => getDaysInfo(o.tentative_dispatch_date).text.includes('overdue')).length;

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
      <Header title="Dispatch Reminders" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-text-dark">{orders.length}</div>
              <div className="text-sm text-text-muted">Total Pending</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
              <div className="text-sm text-text-muted">Overdue</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{todayCount}</div>
              <div className="text-sm text-text-muted">Due Today</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-yellow-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{tomorrowCount}</div>
              <div className="text-sm text-text-muted">Due Tomorrow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)}
          className="input px-4 py-3"
        >
          <option value="all">📋 All Pending ({orders.length})</option>
          <option value="today">🔴 Due Today ({todayCount})</option>
          <option value="tomorrow">🟡 Due Tomorrow ({tomorrowCount})</option>
          <option value="this_week">📅 This Week</option>
        </select>
        <div className="flex-1"></div>
        <button
          onClick={() => router.push('/orders-list')}
          className="btn-primary px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <span>View All Orders</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {isLoadingData ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 skeleton rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 skeleton"></div>
                  <div className="h-4 w-48 skeleton"></div>
                </div>
                <div className="h-8 w-24 skeleton rounded-lg"></div>
              </div>
            </div>
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-100 shadow-sm text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-medium text-text-dark mb-1">No pending dispatches!</h3>
            <p className="text-text-muted">
              {urgencyFilter !== 'all' ? 'No orders match this filter.' : 'All orders are up to date.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order, index) => {
            const daysInfo = getDaysInfo(order.tentative_dispatch_date);
            
            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-xl p-6 border shadow-sm animate-fadeIn ${
                  daysInfo.urgent ? 'border-orange-200' : 'border-gray-100'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Days Badge */}
                  <div className={`flex-shrink-0 w-20 h-20 rounded-xl ${daysInfo.color} flex flex-col items-center justify-center`}>
                    {daysInfo.text === 'Today' ? (
                      <>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-bold mt-1">TODAY</span>
                      </>
                    ) : daysInfo.text === 'Tomorrow' ? (
                      <>
                        <span className="text-2xl font-bold">1</span>
                        <span className="text-xs font-medium">DAY</span>
                      </>
                    ) : daysInfo.text.includes('overdue') ? (
                      <>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-bold mt-1">OVERDUE</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-bold">{daysInfo.text.split(' ')[0]}</span>
                        <span className="text-xs font-medium">DAYS</span>
                      </>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-text-dark">{order.order_id}</span>
                      {order.customer_po_number && (
                        <span className="text-xs text-text-muted">• PO: {order.customer_po_number}</span>
                      )}
                    </div>
                    <div className="text-sm text-text-muted mb-2">
                      <span className="font-medium text-text-dark">{order.vendor_name}</span>
                      <span className="mx-2">•</span>
                      <span className="capitalize">{order.vendor_type}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                        {order.product_type}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                        {order.quantity} {order.unit}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                        ₹{(order.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                    </span>
                    <div className="text-sm text-text-muted">
                      {new Date(order.tentative_dispatch_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {!order.po_shared_with_vendor && (
                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                          PO Not Shared
                        </span>
                      )}
                      <button
                        onClick={() => router.push('/orders-list')}
                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
