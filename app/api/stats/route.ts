import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 총 키워드 수
    const { count: totalKeywords } = await supabase
      .from('keywords')
      .select('id', { count: 'exact' });

    // 급상승 키워드 수
    const { count: risingKeywords } = await supabase
      .from('keywords')
      .select('id', { count: 'exact' })
      .eq('trend_direction', 'rising');

    // 낮은 경쟁도 키워드 수
    const { count: lowCompetition } = await supabase
      .from('keywords')
      .select('id', { count: 'exact' })
      .eq('competition_level', '낮음');

    // 평균 CPC
    const { data: cpcData } = await supabase
      .from('keywords')
      .select('cpc')
      .not('cpc', 'is', null)
      .gt('cpc', 0);

    const averageCpc = cpcData && cpcData.length > 0 
      ? Math.round(cpcData.reduce((sum, item) => sum + (item.cpc || 0), 0) / cpcData.length)
      : 0;

    return NextResponse.json({
      totalKeywords: totalKeywords || 0,
      risingKeywords: risingKeywords || 0,
      lowCompetition: lowCompetition || 0,
      averageCpc
    });

  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}