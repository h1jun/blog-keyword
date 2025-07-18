'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TrendCard from '@/components/trends/TrendCard';
import KeywordRanking from '@/components/trends/KeywordRanking';
import CustomLineChart from '@/components/charts/LineChart';
import CustomBarChart from '@/components/charts/BarChart';
import { TrendingUp, Globe, Search, Star } from 'lucide-react';

interface GoogleTrendData {
  stats: {
    totalKeywords: number;
    avgInterest: number;
    risingKeywords: number;
    stableKeywords: number;
  };
  topKeywords: Array<{
    keyword: string;
    score: number;
    searchVolume: number;
    change?: number;
    rank: number;
  }>;
  interestTrend: Array<{
    name: string;
    value: number;
  }>;
  risingKeywords: Array<{
    name: string;
    value: number;
  }>;
}

export default function GoogleTrendsPage() {
  const [data, setData] = useState<GoogleTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12m');

  useEffect(() => {
    fetchGoogleTrends();
  }, [timeRange]);

  const fetchGoogleTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trends/google/stats?range=${timeRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch google trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">구글 트렌드 데이터를 불러올 수 없습니다.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">구글 트렌드 분석</h1>
            <p className="text-gray-600 mt-2">Google Trends API 기반 키워드 관심도 분석</p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3m">지난 3개월</option>
              <option value="12m">지난 12개월</option>
              <option value="5y">지난 5년</option>
            </select>

            <button
              onClick={fetchGoogleTrends}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TrendCard
            title="총 키워드 수"
            value={data.stats.totalKeywords.toLocaleString()}
            changeType="increase"
            change={5}
            color="bg-blue-500"
          />
          <TrendCard
            title="평균 관심도"
            value={`${data.stats.avgInterest}점`}
            changeType="increase"
            change={12}
            color="bg-green-500"
          />
          <TrendCard
            title="급상승 키워드"
            value={data.stats.risingKeywords.toLocaleString()}
            changeType="increase"
            change={25}
            color="bg-red-500"
          />
          <TrendCard
            title="안정적 키워드"
            value={data.stats.stableKeywords.toLocaleString()}
            changeType="neutral"
            change={0}
            color="bg-gray-500"
          />
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 관심도 트렌드 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CustomLineChart
              data={data.interestTrend}
              title="관심도 트렌드"
              color="#3B82F6"
              height={300}
            />
          </div>

          {/* 급상승 키워드 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CustomBarChart
              data={data.risingKeywords}
              title="급상승 키워드 TOP 10"
              color="#EF4444"
              height={300}
            />
          </div>
        </div>

        {/* 키워드 순위 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KeywordRanking
            keywords={data.topKeywords}
            title="구글 트렌드 TOP 키워드"
            limit={10}
          />

          {/* 관심도 상세 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">관심도 분석</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">최고 관심도</p>
                    <p className="text-sm text-gray-600">지난 {timeRange} 기간</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">100점</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">글로벌 순위</p>
                    <p className="text-sm text-gray-600">한국 키워드 기준</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">#15</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">인기 급상승</p>
                    <p className="text-sm text-gray-600">지난 주 대비</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">+47%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}