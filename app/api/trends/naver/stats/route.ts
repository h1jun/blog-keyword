import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '7d';

  try {
    // 네이버 키워드 데이터 조회
    const { data: keywords, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('platform', 'naver')
      .order('score', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({
        stats: {
          totalKeywords: 0,
          avgSearchVolume: 0,
          avgCpc: 0,
          lowCompetitionCount: 0
        },
        topKeywords: [],
        volumeTrend: [],
        competitionDistribution: [],
        cpcAnalysis: []
      });
    }

    // 통계 계산
    const totalKeywords = keywords.length;
    const avgSearchVolume = Math.round(
      keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0) / totalKeywords
    );
    const avgCpc = Math.round(
      keywords.reduce((sum, k) => sum + (k.cpc || 0), 0) / totalKeywords
    );
    const lowCompetitionCount = keywords.filter(k => k.competition_level === '낮음').length;

    // 상위 키워드 (TOP 10)
    const topKeywords = keywords.slice(0, 10).map((k, index) => ({
      keyword: k.keyword,
      score: k.score || 0,
      searchVolume: k.search_volume || 0,
      change: Math.floor(Math.random() * 20) - 10, // 임시 변화율
      rank: index + 1
    }));

    // 검색량 트렌드 (임시 데이터)
    const volumeTrend = generateTrendData(range, avgSearchVolume);

    // 경쟁도 분포
    const competitionCounts = {
      '낮음': keywords.filter(k => k.competition_level === '낮음').length,
      '중간': keywords.filter(k => k.competition_level === '중간').length,
      '높음': keywords.filter(k => k.competition_level === '높음').length
    };

    const competitionDistribution = [
      { name: '낮음', value: competitionCounts['낮음'], color: '#10B981' },
      { name: '중간', value: competitionCounts['중간'], color: '#F59E0B' },
      { name: '높음', value: competitionCounts['높음'], color: '#EF4444' }
    ];

    // CPC 분석 (구간별)
    const cpcRanges = {
      '0-100': keywords.filter(k => (k.cpc || 0) <= 100).length,
      '101-500': keywords.filter(k => (k.cpc || 0) > 100 && (k.cpc || 0) <= 500).length,
      '501-1000': keywords.filter(k => (k.cpc || 0) > 500 && (k.cpc || 0) <= 1000).length,
      '1000+': keywords.filter(k => (k.cpc || 0) > 1000).length
    };

    const cpcAnalysis = [
      { name: '0-100원', value: cpcRanges['0-100'] },
      { name: '101-500원', value: cpcRanges['101-500'] },
      { name: '501-1000원', value: cpcRanges['501-1000'] },
      { name: '1000원+', value: cpcRanges['1000+'] }
    ];

    return NextResponse.json({
      stats: {
        totalKeywords,
        avgSearchVolume,
        avgCpc,
        lowCompetitionCount
      },
      topKeywords,
      volumeTrend,
      competitionDistribution,
      cpcAnalysis
    });

  } catch (error) {
    console.error('Failed to fetch naver trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch naver trends' },
      { status: 500 }
    );
  }
}

function generateTrendData(range: string, baseValue: number) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 임시 트렌드 데이터 생성
    const variation = (Math.random() - 0.5) * 0.3; // ±15% 변동
    const value = Math.round(baseValue * (1 + variation));
    
    data.push({
      name: date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      }),
      value: Math.max(0, value)
    });
  }
  
  return data;
}