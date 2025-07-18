'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, TrendingUp, Globe, Search } from 'lucide-react';

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

interface KeywordCardProps {
  keyword: KeywordData;
}

export default function KeywordCard({ keyword }: KeywordCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const getCompetitionColor = (level: string) => {
    switch (level) {
      case '낮음': return 'bg-green-100 text-green-800';
      case '중간': return 'bg-yellow-100 text-yellow-800';
      case '높음': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'rising') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (direction === 'falling') return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <span className="h-4 w-4 text-gray-400">−</span>;
  };

  const getTrendBadge = (direction: string) => {
    if (direction === 'rising') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          🔥 급상승
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{keyword.keyword}</h3>
              {getTrendBadge(keyword.trendDirection)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Google: {keyword.googleScore > 0 ? `${keyword.googleScore}점` : '데이터 없음'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  네이버: {keyword.naverVolume.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(keyword.competitionLevel)}`}>
                경쟁도: {keyword.competitionLevel}
              </span>
              <span className="text-sm text-gray-600">CPC: ₩{keyword.cpc.toLocaleString()}</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(keyword.trendDirection)}
                <span className="text-sm text-gray-600">
                  {keyword.trendDirection === 'rising' ? '상승중' : 
                   keyword.trendDirection === 'falling' ? '하락중' : '안정적'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {keyword.totalScore}
              </div>
              <div className="text-xs text-gray-500">종합점수</div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Star className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {keyword.longtailKeywords && keyword.longtailKeywords.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            롱테일 키워드 {keyword.longtailKeywords.length}개
          </button>
        )}
      </div>
      
      {expanded && keyword.longtailKeywords && (
        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {keyword.longtailKeywords.map((lt, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{lt.keyword}</span>
                <span className="text-gray-500">({lt.volume.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}