'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TrendCard from '@/components/trends/TrendCard';
import KeywordRanking from '@/components/trends/KeywordRanking';
import CustomLineChart from '@/components/charts/LineChart';
import CustomBarChart from '@/components/charts/BarChart';
import CustomPieChart from '@/components/charts/PieChart';
import { Search, TrendingUp, DollarSign, Target } from 'lucide-react';

interface NaverTrendData {
  stats: {
    totalKeywords: number;
    avgSearchVolume: number;
    avgCpc: number;
    lowCompetitionCount: number;
  };
  topKeywords: Array<{
    keyword: string;
    score: number;
    searchVolume: number;
    change?: number;
    rank: number;
  }>;
  volumeTrend: Array<{
    name: string;
    value: number;
  }>;
  competitionDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  cpcAnalysis: Array<{
    name: string;
    value: number;
  }>;
}

export default function NaverTrendsPage() {
  const [data, setData] = useState<NaverTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchNaverTrends();
  }, [timeRange]);

  const fetchNaverTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trends/naver/stats?range=${timeRange}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch naver trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">네이버 트렌드 데이터를 불러올 수 없습니다.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">네이버 키워드 트렌드</h1>
            <p className="text-gray-600 mt-2">네이버 검색광고 API 기반 키워드 분석</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="7d">지난 7일</option>
              <option value="30d">지난 30일</option>
              <option value="90d">지난 90일</option>
            </select>
            
            <button
              onClick={fetchNaverTrends}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
            change={12}
            color="bg-green-500"
          />
          <TrendCard
            title="평균 검색량"
            value={data.stats.avgSearchVolume.toLocaleString()}
            changeType="increase"
            change={8}
            color="bg-blue-500"
          />
          <TrendCard
            title="평균 CPC"
            value={`₩${data.stats.avgCpc.toLocaleString()}`}
            changeType="decrease"
            change={-3}
            color="bg-orange-500"
          />
          <TrendCard
            title="낮은 경쟁도"
            value={data.stats.lowCompetitionCount.toLocaleString()}
            changeType="increase"
            change={15}
            color="bg-purple-500"
          />
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 검색량 트렌드 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CustomLineChart
              data={data.volumeTrend}
              title="검색량 트렌드"
              color="#10B981"
              height={300}
            />
          </div>

          {/* 경쟁도 분포 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CustomPieChart
              data={data.competitionDistribution}
              title="경쟁도 분포"
              height={300}
            />
          </div>
        </div>

        {/* CPC 분석 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <CustomBarChart
            data={data.cpcAnalysis}
            title="CPC 분석"
            color="#F59E0B"
            height={300}
          />
        </div>

        {/* 키워드 순위 */}
        <KeywordRanking
          keywords={data.topKeywords}
          title="네이버 키워드 TOP 10"
          limit={10}
        />
      </div>
    </MainLayout>
  );
}