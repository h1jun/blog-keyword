import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 테스트 키워드 데이터
    const testKeywords = [
      {
        keyword: '블로그 키워드 자동화',
        search_volume: 1200,
        competition_level: '낮음',
        cpc: 450,
        score: 85,
        platform: 'naver'
      },
      {
        keyword: 'SEO 최적화',
        search_volume: 3400,
        competition_level: '중간',
        cpc: 620,
        score: 92,
        platform: 'naver'
      },
      {
        keyword: '키워드 분석 도구',
        search_volume: 890,
        competition_level: '낮음',
        cpc: 380,
        score: 78,
        platform: 'naver'
      },
      {
        keyword: '컨텐츠 마케팅',
        search_volume: 2100,
        competition_level: '높음',
        cpc: 850,
        score: 68,
        platform: 'naver'
      },
      {
        keyword: '구글 트렌드',
        search_volume: 1560,
        competition_level: '중간',
        cpc: 520,
        score: 74,
        platform: 'google'
      }
    ];

    // 키워드 삽입
    const { data: insertedKeywords, error: keywordError } = await supabase
      .from('keywords')
      .insert(testKeywords)
      .select();

    if (keywordError) {
      console.error('Keyword insert error:', keywordError);
      throw keywordError;
    }

    // 롱테일 키워드 데이터
    const longtailKeywords = [
      {
        parent_keyword: '블로그 키워드 자동화',
        longtail_keyword: '블로그 키워드 자동화 툴',
        source: 'autocomplete'
      },
      {
        parent_keyword: '블로그 키워드 자동화',
        longtail_keyword: '블로그 키워드 자동화 프로그램',
        source: 'related'
      },
      {
        parent_keyword: 'SEO 최적화',
        longtail_keyword: 'SEO 최적화 방법',
        source: 'autocomplete'
      },
      {
        parent_keyword: 'SEO 최적화',
        longtail_keyword: 'SEO 최적화 도구',
        source: 'related'
      },
      {
        parent_keyword: '키워드 분석 도구',
        longtail_keyword: '무료 키워드 분석 도구',
        source: 'autocomplete'
      }
    ];

    // 롱테일 키워드 삽입
    const { data: insertedLongtails, error: longtailError } = await supabase
      .from('longtail_keywords')
      .insert(longtailKeywords)
      .select();

    if (longtailError) {
      console.error('Longtail insert error:', longtailError);
      throw longtailError;
    }

    return NextResponse.json({
      success: true,
      message: 'Test data inserted successfully',
      keywords: insertedKeywords?.length || 0,
      longtails: insertedLongtails?.length || 0
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error },
      { status: 500 }
    );
  }
}