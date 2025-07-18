import { NextRequest, NextResponse } from 'next/server';
import { googleTrendsService } from '@/lib/services/googleTrends';
import { transformSerpTrendsData } from '@/lib/utils/dataTransform';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';
  
  try {
    // 캐시 확인 (1시간 이내 데이터가 있으면 반환)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const { data: cachedData } = await supabase
      .from('keywords')
      .select('*')
      .eq('platform', 'google')
      .gte('created_at', oneHourAgo.toISOString())
      .order('score', { ascending: false });
    
    if (cachedData && cachedData.length > 0) {
      console.log('캐시된 Google Trends 데이터 반환');
      return NextResponse.json({
        success: true,
        source: 'cache',
        data: cachedData
      });
    }
    
    // 새로운 데이터 수집
    let trendsData;
    
    if (type === 'realtime') {
      trendsData = await googleTrendsService.getRealtimeTrends();
    } else {
      trendsData = await googleTrendsService.getDailyTrends();
    }
    
    const transformedData = transformSerpTrendsData(trendsData.trends);
    
    // 데이터베이스에 저장
    if (transformedData.length > 0) {
      const { error } = await supabase
        .from('keywords')
        .upsert(
          transformedData.map(item => ({
            ...item,
            updated_at: new Date().toISOString()
          })),
          { 
            onConflict: 'keyword',
            ignoreDuplicates: false 
          }
        );
      
      if (error) {
        console.error('데이터 저장 오류:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      source: 'serpapi',
      type,
      date: trendsData.date,
      count: transformedData.length,
      data: transformedData,
      metadata: {
        search_id: trendsData.searchMetadata.id,
        total_time_taken: trendsData.searchMetadata.total_time_taken
      }
    });
    
  } catch (error) {
    console.error('SerpAPI Google Trends 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// 특정 키워드의 상세 트렌드 조회
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, timeframe = '7d' } = body;
    
    if (!keyword) {
      return NextResponse.json(
        { success: false, error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const [interestData, relatedQueries] = await Promise.all([
      googleTrendsService.getInterestOverTime(keyword, timeframe),
      googleTrendsService.getRelatedQueries(keyword)
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        interest: interestData,
        related: relatedQueries
      }
    });
    
  } catch (error) {
    console.error('키워드 트렌드 조회 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}