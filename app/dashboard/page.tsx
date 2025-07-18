'use client';

import { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import KeywordCard from '@/components/dashboard/KeywordCard';
import FilterBar from '@/components/dashboard/FilterBar';
import StatsOverview from '@/components/dashboard/StatsOverview';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

interface KeywordData {
  id: number;
  keyword: string;
  googleScore: number;
  naverVolume: number;
  totalScore: number;
  competitionLevel: string;
  cpc: number;
  trendDirection: string;
  longtailKeywords?: Array<{
    keyword: string;
    volume: number;
  }>;
}

export default function DashboardPage() {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('totalScore');

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/keywords?filter=${filter}&sort=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch keywords');
      }
      
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
      setError('키워드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy]);

  useEffect(() => {
    fetchKeywords();
  }, [filter, sortBy, fetchKeywords]);

  const handleExportCsv = () => {
    const csvContent = [
      ['키워드', 'Google 점수', '네이버 검색량', '종합점수', '경쟁도', 'CPC', '트렌드'],
      ...keywords.map(k => [
        k.keyword,
        k.googleScore,
        k.naverVolume,
        k.totalScore,
        k.competitionLevel,
        k.cpc,
        k.trendDirection
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `keywords_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <StatsOverview />
        
        <FilterBar 
          filter={filter}
          sortBy={sortBy}
          onFilterChange={setFilter}
          onSortChange={setSortBy}
          onExportCsv={handleExportCsv}
        />
        
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchKeywords} />
        ) : keywords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">키워드 데이터가 없습니다.</p>
            <button
              onClick={fetchKeywords}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              새로고침
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {keywords.map((keyword) => (
              <KeywordCard key={keyword.id} keyword={keyword} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}