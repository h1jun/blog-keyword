import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Starting real data collection...');
    
    // 실제 수집할 키워드 목록
    const targetKeywords = [
      '블로그',
      'SEO',
      '키워드 마케팅',
      '구글 애널리틱스',
      '디지털 마케팅',
      '콘텐츠 마케팅',
      '소셜미디어 마케팅',
      '이메일 마케팅',
      '온라인 광고',
      '검색엔진 최적화'
    ];

    const collectedKeywords = [];
    
    for (const keyword of targetKeywords) {
      try {
        console.log(`Collecting data for: ${keyword}`);
        
        // 네이버 API 호출
        const naverResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/naver/keyword`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword }),
        });

        let naverData = null;
        if (naverResponse.ok) {
          const result = await naverResponse.json();
          naverData = result.data;
        }

        // Google Trends API 호출
        const googleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/google/trends`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ keyword }),
        });

        let googleData = null;
        if (googleResponse.ok) {
          const result = await googleResponse.json();
          googleData = result.data;
        }

        // 데이터 통합 및 점수 계산
        const keywordData = {
          keyword,
          search_volume: naverData?.searchVolume || 0,
          competition_level: naverData?.competition || '중간',
          cpc: naverData?.cpc || 0,
          score: calculateScore(naverData, googleData),
          platform: naverData ? 'naver' : 'google'
        };

        collectedKeywords.push(keywordData);
        
        // API 호출 간격 (Rate limiting 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error collecting data for ${keyword}:`, error);
        // 에러가 있어도 다음 키워드 계속 수집
        continue;
      }
    }

    // 기존 테스트 데이터 삭제
    await supabase.from('keywords').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 수집된 데이터를 데이터베이스에 저장
    const { data: insertedData, error: insertError } = await supabase
      .from('keywords')
      .insert(collectedKeywords)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log(`Successfully collected and saved ${collectedKeywords.length} keywords`);

    return NextResponse.json({
      success: true,
      message: `Successfully collected ${collectedKeywords.length} real keywords`,
      keywords: insertedData
    });

  } catch (error) {
    console.error('Collection error:', error);
    return NextResponse.json(
      { error: 'Failed to collect real data', details: error },
      { status: 500 }
    );
  }
}

function calculateScore(naverData: any, googleData: any): number {
  let score = 0;
  
  // 네이버 검색량 기반 점수 (최대 50점)
  if (naverData?.searchVolume) {
    const volume = naverData.searchVolume;
    if (volume > 100000) score += 50;
    else if (volume > 50000) score += 40;
    else if (volume > 10000) score += 30;
    else if (volume > 1000) score += 20;
    else score += 10;
  }

  // 경쟁도 기반 점수 (최대 30점)
  if (naverData?.competition) {
    switch (naverData.competition) {
      case '낮음': score += 30; break;
      case '중간': score += 20; break;
      case '높음': score += 10; break;
    }
  }

  // Google Trends 기반 점수 (최대 20점)
  if (googleData?.interest?.data?.length > 0) {
    const recentValues = googleData.interest.data.slice(-5);
    const avgInterest = recentValues.reduce((sum: number, item: any) => sum + parseInt(item.value), 0) / recentValues.length;
    score += Math.floor(avgInterest * 0.2);
  }

  return Math.min(score, 100);
}