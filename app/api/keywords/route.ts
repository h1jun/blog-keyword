import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get('filter') || 'all';
  const sortBy = searchParams.get('sort') || 'totalScore';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    console.log('Fetching keywords with params:', { filter, sortBy, limit, offset });
    
    let query = supabase
      .from('keywords')
      .select('*');

    // 필터 적용
    switch (filter) {
      case 'lowCompetition':
        query = query.eq('competition_level', '낮음');
        break;
    }

    // 정렬 적용
    const sortColumn = sortBy === 'totalScore' ? 'score' : 
                      sortBy === 'naverVolume' ? 'search_volume' :
                      sortBy === 'createdAt' ? 'created_at' : sortBy;
    
    query = query.order(sortColumn, { ascending: false });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Keywords data:', data);

    // 데이터 변환
    const keywords = data?.map(item => ({
      id: item.id,
      keyword: item.keyword,
      googleScore: 0, // 현재 스키마에 없음
      naverVolume: item.search_volume || 0,
      totalScore: item.score || 0,
      competitionLevel: item.competition_level || '중간',
      cpc: item.cpc || 0,
      trendDirection: 'stable', // 현재 스키마에 없음
      longtailKeywords: []
    })) || [];

    return NextResponse.json({
      keywords,
      total: keywords.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Failed to fetch keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}