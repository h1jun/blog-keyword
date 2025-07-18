'use client';

import { useState } from 'react';
import { RefreshCw, Settings, Menu } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

export default function Header() {
  const { isMobile } = useResponsive();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/collect/all', {
        method: 'POST',
      });
      if (response.ok) {
        // 페이지 새로고침 대신 부드러운 업데이트
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      alert('데이터 수집에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 2000);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <button className="lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
          )}
          <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
            {isMobile ? '키워드 대시보드' : '키워드 트렌드 대시보드'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}