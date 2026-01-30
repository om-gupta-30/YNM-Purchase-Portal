'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

export default function Header({ title, showBack = true }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="header-gradient rounded-2xl p-5 md:p-6 mb-6 shadow-lg animate-fadeIn">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex-shrink-0">
            <Image
              src="/ynm-logo-horizontal.jpg"
              alt="YNM Safety"
              width={140}
              height={50}
              className="h-10 md:h-12 w-auto rounded-lg"
              priority
            />
          </Link>
          {showBack && (
            <Link
              href="/dashboard"
              className="btn-primary px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-cream tracking-tight">{title}</h1>
            <p className="text-cream/60 text-xs md:text-sm mt-0.5 hidden sm:block">YNM Safety Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-text-dark font-bold text-sm">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-left">
              <p className="text-cream text-sm font-medium">{user?.username}</p>
              <p className="text-cream/60 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-primary px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
