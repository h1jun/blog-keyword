'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Search, 
  BookmarkPlus,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

export default function Sidebar() {
  const { isMobile } = useResponsive();
  const [collapsed, setCollapsed] = useState(isMobile);
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: '대시보드', href: '/dashboard' },
    { icon: TrendingUp, label: 'Google 트렌드', href: '/trends/google' },
    { icon: Search, label: '네이버 키워드', href: '/trends/naver' },
    { icon: BookmarkPlus, label: '북마크', href: '/bookmarks' },
    { icon: Settings, label: '설정', href: '/settings' }
  ];

  return (
    <aside className={`bg-white border-r transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } ${isMobile ? 'fixed inset-y-0 left-0 z-50' : ''}`}>
      <div className="h-full flex flex-col">
        <div className="p-4 flex justify-end">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${
              collapsed ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
        
        <nav className="flex-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {!collapsed && (
          <div className="p-4 border-t">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">자동 수집</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <div className="text-xs text-gray-500">
                마지막 수집: 5분 전
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}