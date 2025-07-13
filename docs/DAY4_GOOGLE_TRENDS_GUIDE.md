# Day 4: Google Trends API 연동 가이드

## 📋 개요
Google Trends 데이터를 수집하여 실시간 트렌드 키워드를 파악하는 기능을 구현합니다.

## 🎯 Day 4 목표
- Google Trends API 패키지 설치 및 설정
- 일일 트렌드 수집 기능 구현
- 데이터 정규화 및 저장
- API Route 구현

## 📚 사전 준비

### 1. 패키지 설치
```bash
# Google Trends API 패키지
pnpm add google-trends-api

# 프록시 처리를 위한 패키지 (선택사항)
pnpm add https-proxy-agent
```

## 🔧 구현 단계

### Step 1: Google Trends 서비스 타입 정의 (30분)

#### 1.1 타입 정의 파일 생성
```typescript
// lib/types/googleTrends.ts
export interface GoogleTrendItem {
  title: string;
  formattedTraffic: string;
  relatedQueries: string[];
  articles?: Array<{
    title: string;
    snippet: string;
    source: string;
    url: string;
  }>;
}

export interface GoogleTrendsResponse {
  date: string;
  trends: GoogleTrendItem[];
}

export interface InterestOverTimeData {
  keyword: string;
  data: Array<{
    time: string;
    value: number;
  }>;
}
```

### Step 2: Google Trends 서비스 구현 (1시간 30분)

#### 2.1 서비스 클래스 생성
```typescript
// lib/services/googleTrends.ts
import googleTrends from 'google-trends-api';
import type { GoogleTrendItem, GoogleTrendsResponse } from '@/lib/types/googleTrends';

export class GoogleTrendsService {
  private readonly geo: string = 'KR';
  
  /**
   * 일일 트렌드 수집
   */
  async getDailyTrends(): Promise<GoogleTrendsResponse> {
    try {
      console.log('Google Trends 일일 트렌드 수집 시작...');
      
      const results = await googleTrends.dailyTrends({
        geo: this.geo,
      });
      
      const data = JSON.parse(results);
      const trendingSearchesDays = data.default.trendingSearchesDays;
      
      if (!trendingSearchesDays || trendingSearchesDays.length === 0) {
        console.log('트렌드 데이터가 없습니다.');
        return {
          date: new Date().toISOString(),
          trends: []
        };
      }
      
      // 가장 최근 날짜의 트렌드 가져오기
      const latestDay = trendingSearchesDays[0];
      const trends: GoogleTrendItem[] = latestDay.trendingSearches.map((item: any) => ({
        title: item.title.query,
        formattedTraffic: item.formattedTraffic || 'N/A',
        relatedQueries: item.relatedQueries?.rankedList?.[0]?.rankedKeyword?.map((q: any) => q.query) || [],
        articles: item.articles?.map((article: any) => ({
          title: article.title,
          snippet: article.snippet,
          source: article.source,
          url: article.url
        })) || []
      }));
      
      console.log(`${trends.length}개의 트렌드 수집 완료`);
      
      return {
        date: latestDay.date,
        trends
      };
      
    } catch (error) {
      console.error('Google Trends 수집 오류:', error);
      throw new Error('Google Trends 데이터 수집 실패');
    }
  }
  
  /**
   * 특정 키워드의 시간별 관심도 조회
   */
  async getInterestOverTime(keyword: string, days: number = 7): Promise<InterestOverTimeData> {
    try {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - days);
      
      const results = await googleTrends.interestOverTime({
        keyword,
        startTime,
        geo: this.geo,
        granularTimeResolution: true,
      });
      
      const parsedData = JSON.parse(results);
      const timelineData = parsedData.default.timelineData || [];
      
      const data = timelineData.map((item: any) => ({
        time: item.formattedTime,
        value: item.value[0] || 0
      }));
      
      return {
        keyword,
        data
      };
      
    } catch (error) {
      console.error(`키워드 "${keyword}" 관심도 조회 오류:`, error);
      return {
        keyword,
        data: []
      };
    }
  }
  
  /**
   * 연관 검색어 조회
   */
  async getRelatedQueries(keyword: string): Promise<string[]> {
    try {
      const results = await googleTrends.relatedQueries({
        keyword,
        geo: this.geo,
      });
      
      const parsedData = JSON.parse(results);
      const relatedQueries = parsedData.default.rankedList?.[0]?.rankedKeyword || [];
      
      return relatedQueries.map((item: any) => item.query);
      
    } catch (error) {
      console.error(`키워드 "${keyword}" 연관 검색어 조회 오류:`, error);
      return [];
    }
  }
}

// 싱글톤 인스턴스 export
export const googleTrendsService = new GoogleTrendsService();
```

### Step 3: 데이터 변환 및 저장 로직 (1시간)

#### 3.1 데이터 변환 유틸리티
```typescript
// lib/utils/dataTransform.ts
import type { GoogleTrendItem } from '@/lib/types/googleTrends';
import type { KeywordData } from '@/lib/types/common';

export function transformGoogleTrendsData(trends: GoogleTrendItem[]): KeywordData[] {
  return trends.map((trend, index) => {
    // 트래픽을 숫자로 변환 (예: "100K+" -> 100000)
    const trafficValue = parseTrafficValue(trend.formattedTraffic);
    
    // Google Trends는 경쟁도를 제공하지 않으므로 트래픽 기반으로 추정
    const competitionLevel = estimateCompetition(trafficValue);
    
    // 점수 계산 (트렌드 순위와 트래픽 기반)
    const score = calculateTrendScore(index, trafficValue);
    
    return {
      keyword: trend.title,
      search_volume: trafficValue,
      competition_level: competitionLevel,
      cpc: 0, // Google Trends는 CPC 정보 없음
      score,
      platform: 'google',
      metadata: {
        related_queries: trend.relatedQueries,
        articles_count: trend.articles?.length || 0,
        traffic_formatted: trend.formattedTraffic
      }
    };
  });
}

function parseTrafficValue(formattedTraffic: string): number {
  if (!formattedTraffic || formattedTraffic === 'N/A') return 0;
  
  // "100K+" -> 100000, "1M+" -> 1000000
  const value = formattedTraffic.replace(/[+,]/g, '');
  const multiplier = value.includes('K') ? 1000 : value.includes('M') ? 1000000 : 1;
  const numericValue = parseFloat(value.replace(/[KM]/g, ''));
  
  return Math.round(numericValue * multiplier);
}

function estimateCompetition(trafficValue: number): string {
  if (trafficValue >= 1000000) return '높음';
  if (trafficValue >= 100000) return '중간';
  return '낮음';
}

function calculateTrendScore(rank: number, trafficValue: number): number {
  // 순위 점수 (1위: 50점, 2위: 45점, ...)
  const rankScore = Math.max(50 - (rank * 5), 0);
  
  // 트래픽 점수 (최대 50점)
  let trafficScore = 0;
  if (trafficValue >= 1000000) trafficScore = 50;
  else if (trafficValue >= 500000) trafficScore = 40;
  else if (trafficValue >= 100000) trafficScore = 30;
  else if (trafficValue >= 50000) trafficScore = 20;
  else if (trafficValue >= 10000) trafficScore = 10;
  else trafficScore = 5;
  
  return rankScore + trafficScore;
}
```

### Step 4: API Route 구현 (1시간)

#### 4.1 Google Trends API Route
```typescript
// app/api/google/trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { googleTrendsService } from '@/lib/services/googleTrends';
import { transformGoogleTrendsData } from '@/lib/utils/dataTransform';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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
    const trendsData = await googleTrendsService.getDailyTrends();
    const transformedData = transformGoogleTrendsData(trendsData.trends);
    
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
      source: 'api',
      date: trendsData.date,
      count: transformedData.length,
      data: transformedData
    });
    
  } catch (error) {
    console.error('Google Trends API 오류:', error);
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
    const { keyword, days = 7 } = body;
    
    if (!keyword) {
      return NextResponse.json(
        { success: false, error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }
    
    const [interestData, relatedQueries] = await Promise.all([
      googleTrendsService.getInterestOverTime(keyword, days),
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
```

### Step 5: 테스트 및 디버깅 (30분)

#### 5.1 테스트 스크립트 생성
```typescript
// scripts/testGoogleTrends.ts
import { googleTrendsService } from '../lib/services/googleTrends';

async function testGoogleTrends() {
  console.log('=== Google Trends 테스트 시작 ===\n');
  
  try {
    // 1. 일일 트렌드 테스트
    console.log('1. 일일 트렌드 수집 테스트');
    const dailyTrends = await googleTrendsService.getDailyTrends();
    console.log(`- 수집된 트렌드 수: ${dailyTrends.trends.length}`);
    console.log(`- 상위 3개 트렌드:`);
    dailyTrends.trends.slice(0, 3).forEach((trend, i) => {
      console.log(`  ${i + 1}. ${trend.title} (${trend.formattedTraffic})`);
    });
    
    // 2. 특정 키워드 트렌드 테스트
    console.log('\n2. 키워드 트렌드 테스트');
    const keyword = '챗GPT';
    const interestData = await googleTrendsService.getInterestOverTime(keyword, 7);
    console.log(`- "${keyword}" 관심도 데이터 포인트: ${interestData.data.length}개`);
    
    // 3. 연관 검색어 테스트
    console.log('\n3. 연관 검색어 테스트');
    const relatedQueries = await googleTrendsService.getRelatedQueries(keyword);
    console.log(`- "${keyword}" 연관 검색어: ${relatedQueries.length}개`);
    console.log(`- 상위 5개:`, relatedQueries.slice(0, 5));
    
    console.log('\n=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

// 테스트 실행
testGoogleTrends();
```

#### 5.2 실행 명령어
```bash
# 테스트 스크립트 실행
pnpm tsx scripts/testGoogleTrends.ts

# API Route 테스트
curl http://localhost:3000/api/google/trends

# 특정 키워드 트렌드 조회
curl -X POST http://localhost:3000/api/google/trends \
  -H "Content-Type: application/json" \
  -d '{"keyword": "챗GPT", "days": 7}'
```

## 🔍 트러블슈팅

### 1. 프록시 에러 발생 시
```typescript
// lib/services/googleTrends.ts에 추가
import { HttpsProxyAgent } from 'https-proxy-agent';

// 프록시 설정이 필요한 경우
const proxyAgent = process.env.HTTPS_PROXY 
  ? new HttpsProxyAgent(process.env.HTTPS_PROXY)
  : undefined;

// googleTrends 옵션에 추가
const results = await googleTrends.dailyTrends({
  geo: this.geo,
  agent: proxyAgent
});
```

### 2. Rate Limiting 대응
```typescript
// 재시도 로직 추가
async function withRetry<T>(
  fn: () => Promise<T>, 
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`재시도 중... (${retries}회 남음)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
```

### 3. 데이터가 없는 경우
```typescript
// 기본값 처리
const defaultResponse: GoogleTrendsResponse = {
  date: new Date().toISOString(),
  trends: []
};
```

## ✅ Day 4 체크리스트

### 완료 항목
- [ ] Google Trends API 패키지 설치
- [ ] 타입 정의 완료
- [ ] 서비스 클래스 구현
- [ ] 데이터 변환 로직 구현
- [ ] API Route 구현
- [ ] 캐싱 로직 추가
- [ ] 테스트 스크립트 작성
- [ ] 에러 핸들링 구현

### 테스트 항목
- [ ] 일일 트렌드 수집 성공
- [ ] 키워드 관심도 조회 성공
- [ ] 연관 검색어 조회 성공
- [ ] 데이터베이스 저장 확인
- [ ] 캐싱 동작 확인

## 📝 다음 단계 (Day 5)
- YouTube API 연동
- 동영상 메타데이터에서 키워드 추출
- 플랫폼 간 데이터 통합 로직 구현
