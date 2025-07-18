import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 최근 수집 상태 조회
    const { data: recentCollection } = await supabase
      .from('keywords')
      .select('created_at, platform')
      .order('created_at', { ascending: false })
      .limit(1);
    
    // 키워드 통계
    const { data: keywordCount } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true });
    
    const { data: competitionStats } = await supabase
      .from('keywords')
      .select('competition_level')
      .neq('competition_level', null);
    
    const { data: platformStats } = await supabase
      .from('keywords')
      .select('platform')
      .neq('platform', null);
    
    // 통계 계산
    const competitionCounts = competitionStats?.reduce((acc: any, item: any) => {
      acc[item.competition_level] = (acc[item.competition_level] || 0) + 1;
      return acc;
    }, {}) || {};
    
    const platformCounts = platformStats?.reduce((acc: any, item: any) => {
      acc[item.platform] = (acc[item.platform] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // 수집 상태 정보
    const status = {
      lastCollection: recentCollection?.[0]?.created_at || null,
      totalKeywords: keywordCount?.count || 0,
      competitionStats: competitionCounts,
      platformStats: platformCounts,
      isHealthy: checkSystemHealth(),
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(status);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get collection status', details: error.message },
      { status: 500 }
    );
  }
}

function checkSystemHealth(): boolean {
  // 시스템 상태 체크 로직
  const hasNaverApi = !!process.env.NAVER_API_KEY;
  const hasSerpApi = !!process.env.SERPAPI_KEY;
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  return hasNaverApi && hasSerpApi && hasSupabase;
}