'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth, useAuthFetch } from '@/hooks/useAuth';
import Link from 'next/link';

interface Stats {
  products: number;
  manufacturers: number;
  orders: number;
  importers: number;
  dealers: number;
  customers: number;
  ordersNew: number;
  pendingDispatches: number;
}

// Admin navigation items
const adminNavItems = [
  { 
    title: 'Products', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    href: '/products', 
    description: 'Add, edit & delete products',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    title: 'Manufacturers', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    href: '/manufacturers', 
    description: 'Add, edit & delete suppliers',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    title: 'Importers', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: '/importers', 
    description: 'Manage global importers',
    color: 'from-teal-500 to-teal-600'
  },
  { 
    title: 'Dealers', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    href: '/dealers', 
    description: 'Dealers, stockists & distributors',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    title: 'Customers', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    href: '/customers', 
    description: 'Manage customer database',
    color: 'from-cyan-500 to-cyan-600'
  },
  { 
    title: 'Order History', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    href: '/orders-list', 
    description: 'View all orders & dispatches',
    color: 'from-pink-500 to-pink-600'
  },
  { 
    title: 'Transport', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    href: '/transport', 
    description: 'Calculate transport cost',
    color: 'from-amber-500 to-amber-600'
  },
];

// Employee navigation items
const employeeNavItems = [
  { 
    title: 'Products', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    href: '/products', 
    description: 'Add & edit products',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    title: 'Manufacturers', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    href: '/manufacturers', 
    description: 'Add & edit suppliers',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    title: 'Importers', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: '/importers', 
    description: 'View & edit importers',
    color: 'from-teal-500 to-teal-600'
  },
  { 
    title: 'Dealers', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    href: '/dealers', 
    description: 'View dealers & distributors',
    color: 'from-indigo-500 to-indigo-600'
  },
  { 
    title: 'Customers', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    href: '/customers', 
    description: 'View customer database',
    color: 'from-cyan-500 to-cyan-600'
  },
  { 
    title: 'Create Order', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: '/orders-create', 
    description: 'Create a new order',
    color: 'from-green-500 to-green-600'
  },
  { 
    title: 'Order History', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    href: '/orders-list', 
    description: 'View & manage orders',
    color: 'from-pink-500 to-pink-600'
  },
  { 
    title: 'Reminders', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    href: '/reminders', 
    description: 'Dispatch reminders',
    color: 'from-orange-500 to-orange-600'
  },
  { 
    title: 'Transport', 
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    href: '/transport', 
    description: 'Check distance & cost',
    color: 'from-amber-500 to-amber-600'
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const authFetch = useAuthFetch();
  const [stats, setStats] = useState<Stats>({ products: 0, manufacturers: 0, orders: 0, importers: 0, dealers: 0, customers: 0, ordersNew: 0, pendingDispatches: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const [productsRes, manufacturersRes, ordersRes, importersRes, dealersRes, customersRes, ordersNewRes] = await Promise.all([
        authFetch('/api/products'),
        authFetch('/api/manufacturers'),
        authFetch('/api/orders'),
        authFetch('/api/importers'),
        authFetch('/api/dealers'),
        authFetch('/api/customers'),
        authFetch('/api/orders-new'),
      ]);

      const products = await productsRes.json();
      const manufacturers = await manufacturersRes.json();
      const orders = await ordersRes.json();
      const importers = await importersRes.json();
      const dealers = await dealersRes.json();
      const customers = await customersRes.json();
      const ordersNew = await ordersNewRes.json();

      // Calculate pending dispatches (within 5 days)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      interface OrderNew {
        tentative_dispatch_date?: string;
        status?: string;
      }
      const pendingDispatches = Array.isArray(ordersNew) ? ordersNew.filter((o: OrderNew) => {
        if (!o.tentative_dispatch_date) return false;
        if (['dispatched', 'delivered', 'cancelled'].includes(o.status || '')) return false;
        const dispatchDate = new Date(o.tentative_dispatch_date);
        dispatchDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((dispatchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 5 && diffDays >= -2;
      }).length : 0;

      const newStats = {
        products: Array.isArray(products) ? products.length : 0,
        manufacturers: Array.isArray(manufacturers) ? manufacturers.length : 0,
        orders: Array.isArray(orders) ? orders.length : 0,
        importers: Array.isArray(importers) ? importers.length : 0,
        dealers: Array.isArray(dealers) ? dealers.length : 0,
        customers: Array.isArray(customers) ? customers.length : 0,
        ordersNew: Array.isArray(ordersNew) ? ordersNew.length : 0,
        pendingDispatches,
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [authFetch]);

  // Fetch stats on mount and when page becomes visible
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, fetchStats]);

  // Refresh stats when user returns to the page (tab focus or visibility)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };

    const handleFocus = () => {
      fetchStats();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, fetchStats]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner-lg"></div>
          <p className="text-cream/80 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { label: 'Products', value: stats.products, icon: '📦', color: 'from-blue-400 to-blue-500' },
    { label: 'Manufacturers', value: stats.manufacturers, icon: '🏭', color: 'from-purple-400 to-purple-500' },
    { label: 'Importers', value: stats.importers, icon: '🌍', color: 'from-teal-400 to-teal-500' },
    { label: 'Dealers', value: stats.dealers, icon: '🤝', color: 'from-indigo-400 to-indigo-500' },
    { label: 'Customers', value: stats.customers, icon: '👥', color: 'from-cyan-400 to-cyan-500' },
    { label: 'Order History', value: stats.ordersNew, icon: '📋', color: 'from-pink-400 to-pink-500' },
  ];

  return (
    <div className="container-card w-full p-6 md:p-10 lg:p-12 animate-fadeIn flex flex-col">
      {/* Header */}
      <div className="header-gradient rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Image
                src="/ynm-logo-horizontal.jpg"
                alt="YNM Safety"
                width={180}
                height={60}
                className="h-12 md:h-14 w-auto rounded-lg"
                priority
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-cream">Safety Portal</h1>
                <p className="text-cream/60 text-sm">Purchase Management System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm flex-1 md:flex-none">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-text-dark font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-cream font-medium">{user?.username}</p>
                <p className="text-cream/60 text-sm capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-primary px-5 py-3 rounded-xl font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pending Dispatches Alert - Only for employees */}
      {stats.pendingDispatches > 0 && user?.role === 'employee' && (
        <Link href="/reminders" className="block mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Dispatch Reminders</h3>
                  <p className="text-white/80 text-sm">{stats.pendingDispatches} order{stats.pendingDispatches > 1 ? 's' : ''} pending dispatch in next 5 days</p>
                </div>
              </div>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-6 mb-8">
        {statItems.map((stat, index) => (
          <div 
            key={stat.label} 
            className="stats-card animate-slideUp"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <h3 className="text-text-dark text-sm font-semibold">{stat.label}</h3>
            </div>
            {isLoadingStats ? (
              <div className="h-8 w-16 mx-auto skeleton"></div>
            ) : (
              <p className="text-3xl font-bold gradient-text">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Cards */}
      <div className="flex-1 mb-8">
        <h2 className="text-lg font-semibold text-text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {user?.role === 'admin' ? 'Admin Actions' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {(user?.role === 'admin' ? adminNavItems : employeeNavItems).map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-card animate-slideUp group relative ${item.href === '/reminders' && stats.pendingDispatches > 0 ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              {/* Special layout for Reminders with pending dispatches */}
              {item.href === '/reminders' && stats.pendingDispatches > 0 ? (
                <>
                  <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold">{stats.pendingDispatches}</span>
                  </div>
                  <h2 className="text-base font-semibold text-red-600 mb-1">{item.title}</h2>
                  <p className="text-xs text-red-500 hidden sm:block font-medium">
                    {stats.pendingDispatches} pending dispatch{stats.pendingDispatches > 1 ? 'es' : ''}
                  </p>
                </>
              ) : (
                <>
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h2 className="text-base font-semibold text-text-dark mb-1">{item.title}</h2>
                  <p className="text-xs text-text-muted hidden sm:block">{item.description}</p>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="header-gradient rounded-xl p-4 text-center shadow-md mt-auto">
        <p className="text-cream/80 text-sm flex items-center justify-center gap-2">
          <span className="font-medium">YNM Safety Portal</span>
          <span className="text-cream/40">|</span>
          <span className="text-cream/60">All Rights Reserved {new Date().getFullYear()}</span>
        </p>
        <p className="text-cream/40 text-xs mt-2">Created by Om Gupta</p>
      </footer>
    </div>
  );
}
