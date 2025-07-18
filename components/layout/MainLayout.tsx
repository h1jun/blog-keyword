'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useResponsive } from '@/hooks/useResponsive';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isMobile } = useResponsive();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}