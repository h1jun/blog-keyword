import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '12m';

  try {
    // 모든 키워드 데이터 조회 (Google Trends는 플랫폼 구분 없이 모든 키워드 대상)
    const { data: keywords, error } = await supabase
      .from('keywords')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({
        stats: {
          totalKeywords: 0,
          avgInterest: 0,
          risingKeywords: 0,
          stableKeywords: 0
        },
        topKeywords: [],
        interestTrend: [],
        risingKeywords: [],
        regionalInterest: []
      });
    }

    // 통계 계산
    const totalKeywords = keywords.length;
    const avgInterest = Math.round(
      keywords.reduce((sum, k) => sum + (k.score || 0), 0) / totalKeywords
    );
    
    // 급상승/안정적 키워드 (임시로 점수 기준 분류)
    const risingKeywords = keywords.filter(k => (k.score || 0) > 50).length;
    const stableKeywords = totalKeywords - risingKeywords;

    // 상위 키워드 (TOP 10)
    const topKeywords = keywords.slice(0, 10).map((k, index) => ({
      keyword: k.keyword,
      score: k.score || 0,
      searchVolume: k.search_volume || 0,
      change: Math.floor(Math.random() * 30) - 10, // 임시 변화율
      rank: index + 1
    }));

    // 관심도 트렌드 (임시 데이터)
    const interestTrend = generateInterestTrend(range, avgInterest);

    // 급상승 키워드 TOP 10
    const risingKeywordsList = keywords
      .filter(k => (k.score || 0) > 60)
      .slice(0, 10)
      .map(k => ({
        name: k.keyword,
        value: k.score || 0
      }));

    // 지역별 관심도 (임시 데이터)
    const regionalInterest = [
      { name: '서울', value: 100 },
      { name: '부산', value: 85 },
      { name: '대구', value: 78 },
      { name: '인천', value: 72 },
      { name: '광주', value: 65 },
      { name: '대전', value: 68 },
      { name: '울산', value: 58 },
      { name: '세종', value: 62 },
      { name: '경기', value: 95 },
      { name: '강원', value: 45 }
    ];

    return NextResponse.json({
      stats: {
        totalKeywords,
        avgInterest,
        risingKeywords,
        stableKeywords
      },
      topKeywords,
      interestTrend,
      risingKeywords: risingKeywordsList,
      regionalInterest
    });

  } catch (error) {
    console.error('Failed to fetch google trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch google trends' },
      { status: 500 }
    );
  }
}

function generateInterestTrend(range: string, baseInterest: number) {
  const months = range === '3m' ? 3 : range === '12m' ? 12 : 60;
  const data = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    // 임시 관심도 트렌드 데이터 생성
    const variation = (Math.random() - 0.5) * 0.4; // ±20% 변동
    const value = Math.round(baseInterest * (1 + variation));
    
    data.push({
      name: date.toLocaleDateString('ko-KR', { 
        year: range === '5y' ? '2-digit' : undefined,
        month: 'short'
      }),
      value: Math.max(0, Math.min(100, value))
    });
  }
  
  return data;
}