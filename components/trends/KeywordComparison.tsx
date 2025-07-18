'use client';

import { useState } from 'react';
import { X, Plus, TrendingUp, Search, DollarSign } from 'lucide-react';
import CustomLineChart from '@/components/charts/LineChart';

interface KeywordComparisonProps {
  availableKeywords: Array<{
    keyword: string;
    searchVolume: number;
    score: number;
    platform: string;
  }>;
}

interface ComparisonData {
  keyword: string;
  searchVolume: number;
  score: number;
  platform: string;
  trend: Array<{
    name: string;
    value: number;
  }>;
}

export default function KeywordComparison({ availableKeywords }: KeywordComparisonProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const addKeyword = (keyword: string) => {
    if (selectedKeywords.length >= 5) {
      alert('최대 5개까지 비교할 수 있습니다.');
      return;
    }

    if (selectedKeywords.includes(keyword)) {
      return;
    }

    const keywordData = availableKeywords.find(k => k.keyword === keyword);
    if (!keywordData) return;

    setSelectedKeywords(prev => [...prev, keyword]);
    
    // 임시 트렌드 데이터 생성
    const trend = generateTrendData(keywordData.searchVolume);
    
    setComparisonData(prev => [...prev, {
      ...keywordData,
      trend
    }]);
  };

  const removeKeyword = (keyword: string) => {
    setSelectedKeywords(prev => prev.filter(k => k !== keyword));
    setComparisonData(prev => prev.filter(k => k.keyword !== keyword));
  };

  const generateTrendData = (baseValue: number) => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const variation = (Math.random() - 0.5) * 0.3;
      const value = Math.round(baseValue * (1 + variation));
      
      return {
        name: date.toLocaleDateString('ko-KR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: Math.max(0, value)
      };
    });
  };

  const filteredKeywords = availableKeywords.filter(k => 
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedKeywords.includes(k.keyword)
  );

  const getComparisonChartData = () => {
    if (comparisonData.length === 0) return [];

    const allDates = comparisonData[0].trend.map(item => item.name);
    
    return allDates.map(date => {
      const dataPoint: any = { name: date };
      
      comparisonData.forEach(keyword => {
        const trendItem = keyword.trend.find(t => t.name === date);
        dataPoint[keyword.keyword] = trendItem ? trendItem.value : 0;
      });
      
      return dataPoint;
    });
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">키워드 비교 분석</h3>
      
      {/* 키워드 검색 및 추가 */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="키워드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {searchTerm && (
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredKeywords.slice(0, 5).map(keyword => (
              <button
                key={keyword.keyword}
                onClick={() => addKeyword(keyword.keyword)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span>{keyword.keyword}</span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{keyword.searchVolume.toLocaleString()}</span>
                  <Plus className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 선택된 키워드 */}
      {selectedKeywords.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 키워드</h4>
          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map((keyword, index) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: colors[index] }}
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="hover:bg-black hover:bg-opacity-20 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 비교 차트 */}
      {comparisonData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">검색량 트렌드 비교</h4>
          <div className="h-80">
            <CustomLineChart
              data={getComparisonChartData()}
              height={300}
            />
          </div>
        </div>
      )}

      {/* 비교 테이블 */}
      {comparisonData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">키워드</th>
                <th className="text-left py-2 px-4">검색량</th>
                <th className="text-left py-2 px-4">점수</th>
                <th className="text-left py-2 px-4">플랫폼</th>
                <th className="text-left py-2 px-4">트렌드</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((data, index) => (
                <tr key={data.keyword} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium">{data.keyword}</td>
                  <td className="py-2 px-4">{data.searchVolume.toLocaleString()}</td>
                  <td className="py-2 px-4">
                    <span className="font-bold" style={{ color: colors[index] }}>
                      {data.score}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      data.platform === 'naver' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {data.platform === 'naver' ? '네이버' : '구글'}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedKeywords.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>키워드를 검색하여 비교 분석을 시작하세요</p>
          <p className="text-sm mt-1">최대 5개까지 선택할 수 있습니다</p>
        </div>
      )}
    </div>
  );
}