# Day 4: Google Trends API 연동 가이드 (SerpAPI 활용)

## 📋 개요
SerpAPI Google Trends를 활용하여 실시간 트렌드 키워드를 파악하는 기능을 구현합니다.

## 🎯 Day 4 목표
- SerpAPI Google Trends 설정 및 연동
- 일일/실시간 트렌드 수집 기능 구현
- 데이터 정규화 및 저장
- API Route 구현

## 📚 사전 준비

### 1. SerpAPI 계정 생성
1. [SerpAPI 회원가입](https://serpapi.com/users/sign_up)
2. API 키 발급 받기
3. **월 100회 무료 사용 가능** (개발/테스트 단계에 충분)

### 2. 패키지 설치
```bash
# SerpAPI 클라이언트 패키지
pnpm add serpapi

# 타입 정의 (선택사항)
pnpm add -D @types/serpapi
```

## 🔧 구현 단계

### Step 1: SerpAPI Google Trends 서비스 타입 정의 (30분)

#### 1.1 타입 정의 파일 생성
```typescript
// lib/types/googleTrends.ts
export interface SerpTrendItem {
  query: string;
  exploreLink: string;
  serpapi_link: string;
  traffic?: string;
  related_queries?: Array<{
    query: string;
    value: number;
  }>;
}

export interface SerpTrendsResponse {
  date: string;
  trends: SerpTrendItem[];
  searchMetadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    serpapi_version: string;
    total_time_taken: number;
  };
}

export interface InterestOverTimeData {
  keyword: string;
  data: Array<{
    timestamp: string;
    value: number;
  }>;
}
```

### Step 2: SerpAPI Google Trends 서비스 구현 (1시간 30분)

#### 2.1 서비스 클래스 생성
```typescript
// lib/services/googleTrends.ts
import { getJson } from 'serpapi';
import type { SerpTrendItem, SerpTrendsResponse } from '@/lib/types/googleTrends';

export class GoogleTrendsService {
  private readonly apiKey: string;
  private readonly geo: string = 'KR';
  
  constructor() {
    this.apiKey = process.env.SERPAPI_KEY || '';
    if (!this.apiKey) {
      throw new Error('SERPAPI_KEY 환경 변수가 설정되지 않았습니다.');
    }
  }
  
  /**
   * 일일 트렌드 수집
   */
  async getDailyTrends(): Promise<SerpTrendsResponse> {
    try {
      console.log('SerpAPI Google Trends 일일 트렌드 수집 시작...');
      
      const results = await getJson({
        engine: 'google_trends_trending_now',
        geo: this.geo,
        api_key: this.apiKey,
      });
      
      if (!results.daily_searches || results.daily_searches.length === 0) {
        console.log('트렌드 데이터가 없습니다.');
        return {
          date: new Date().toISOString(),
          trends: [],
          searchMetadata: results.search_metadata || {}
        };
      }
      
      const trends: SerpTrendItem[] = results.daily_searches.map((item: any) => ({
        query: item.query,
        exploreLink: item.explore_link,
        serpapi_link: item.serpapi_link,
        traffic: item.traffic || undefined,
        related_queries: item.related_queries || []
      }));
      
      console.log(`${trends.length}개의 트렌드 수집 완료`);
      
      return {
        date: results.search_metadata?.created_at || new Date().toISOString(),
        trends,
        searchMetadata: results.search_metadata || {}
      };
      
    } catch (error) {
      console.error('SerpAPI Google Trends 수집 오류:', error);
      throw new Error('Google Trends 데이터 수집 실패');
    }
  }
  
  /**
   * 실시간 트렌드 수집
   */
  async getRealtimeTrends(): Promise<SerpTrendsResponse> {
    try {
      console.log('SerpAPI Google Trends 실시간 트렌드 수집 시작...');
      
      const results = await getJson({
        engine: 'google_trends_trending_now',
        geo: this.geo,
        api_key: this.apiKey,
        frequency: 'realtime'
      });
      
      if (!results.realtime_searches || results.realtime_searches.length === 0) {
        console.log('실시간 트렌드 데이터가 없습니다.');
        return {
          date: new Date().toISOString(),
          trends: [],
          searchMetadata: results.search_metadata || {}
        };
      }
      
      const trends: SerpTrendItem[] = results.realtime_searches.map((item: any) => ({
        query: item.query,
        exploreLink: item.explore_link,
        serpapi_link: item.serpapi_link,
        traffic: item.traffic || undefined,
        related_queries: item.related_queries || []
      }));
      
      console.log(`${trends.length}개의 실시간 트렌드 수집 완료`);
      
      return {
        date: results.search_metadata?.created_at || new Date().toISOString(),
        trends,
        searchMetadata: results.search_metadata || {}
      };
      
    } catch (error) {
      console.error('SerpAPI 실시간 트렌드 수집 오류:', error);
      throw new Error('실시간 트렌드 데이터 수집 실패');
    }
  }
  
  /**
   * 특정 키워드의 시간별 관심도 조회
   */
  async getInterestOverTime(keyword: string, timeframe: string = '7d'): Promise<InterestOverTimeData> {
    try {
      const results = await getJson({
        engine: 'google_trends',
        q: keyword,
        geo: this.geo,
        data_type: 'TIMESERIES',
        timeframe: timeframe,
        api_key: this.apiKey,
      });
      
      const timelineData = results.interest_over_time?.timeline_data || [];
      
      const data = timelineData.map((item: any) => ({
        timestamp: item.timestamp,
        value: item.values?.[0]?.value || 0
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
      const results = await getJson({
        engine: 'google_trends',
        q: keyword,
        geo: this.geo,
        data_type: 'RELATED_QUERIES',
        api_key: this.apiKey,
      });
      
      const relatedQueries = results.related_queries?.top?.rankedKeyword || [];
      
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
import type { SerpTrendItem } from '@/lib/types/googleTrends';
import type { KeywordData } from '@/lib/types/common';

export function transformSerpTrendsData(trends: SerpTrendItem[]): KeywordData[] {
  return trends.map((trend, index) => {
    // 트래픽을 숫자로 변환 (예: "100K+" -> 100000)
    const trafficValue = parseTrafficValue(trend.traffic);
    
    // Google Trends는 경쟁도를 제공하지 않으므로 트래픽 기반으로 추정
    const competitionLevel = estimateCompetition(trafficValue);
    
    // 점수 계산 (트렌드 순위와 트래픽 기반)
    const score = calculateTrendScore(index, trafficValue);
    
    return {
      keyword: trend.query,
      search_volume: trafficValue,
      competition_level: competitionLevel,
      cpc: 0, // Google Trends는 CPC 정보 없음
      score,
      platform: 'google',
      metadata: {
        related_queries: trend.related_queries?.map(q => q.query) || [],
        explore_link: trend.exploreLink,
        serpapi_link: trend.serpapi_link,
        traffic_formatted: trend.traffic
      }
    };
  });
}

function parseTrafficValue(traffic?: string): number {
  if (!traffic || traffic === 'N/A') return 0;
  
  // "100K+" -> 100000, "1M+" -> 1000000
  const value = traffic.replace(/[+,]/g, '');
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
import { transformSerpTrendsData } from '@/lib/utils/dataTransform';
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

// 실시간 트렌드 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';
  
  try {
    let trendsData;
    
    if (type === 'realtime') {
      trendsData = await googleTrendsService.getRealtimeTrends();
    } else {
      trendsData = await googleTrendsService.getDailyTrends();
    }
    
    const transformedData = transformSerpTrendsData(trendsData.trends);
    
    return NextResponse.json({
      success: true,
      source: 'serpapi',
      type,
      date: trendsData.date,
      count: transformedData.length,
      data: transformedData
    });
    
  } catch (error) {
    console.error('SerpAPI 트렌드 조회 오류:', error);
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
```

### Step 5: 테스트 및 디버깅 (30분)

#### 5.1 테스트 스크립트 생성
```typescript
// scripts/testGoogleTrends.ts
import { googleTrendsService } from '../lib/services/googleTrends';

async function testSerpApiTrends() {
  console.log('=== SerpAPI Google Trends 테스트 시작 ===\n');
  
  try {
    // 1. 일일 트렌드 테스트
    console.log('1. 일일 트렌드 수집 테스트');
    const dailyTrends = await googleTrendsService.getDailyTrends();
    console.log(`- 수집된 트렌드 수: ${dailyTrends.trends.length}`);
    console.log(`- 상위 3개 트렌드:`);
    dailyTrends.trends.slice(0, 3).forEach((trend, i) => {
      console.log(`  ${i + 1}. ${trend.query} (${trend.traffic || 'N/A'})`);
    });
    
    // 2. 실시간 트렌드 테스트
    console.log('\n2. 실시간 트렌드 수집 테스트');
    const realtimeTrends = await googleTrendsService.getRealtimeTrends();
    console.log(`- 수집된 실시간 트렌드 수: ${realtimeTrends.trends.length}`);
    
    // 3. 특정 키워드 트렌드 테스트
    console.log('\n3. 키워드 트렌드 테스트');
    const keyword = '챗GPT';
    const interestData = await googleTrendsService.getInterestOverTime(keyword, '7d');
    console.log(`- "${keyword}" 관심도 데이터 포인트: ${interestData.data.length}개`);
    
    // 4. 연관 검색어 테스트
    console.log('\n4. 연관 검색어 테스트');
    const relatedQueries = await googleTrendsService.getRelatedQueries(keyword);
    console.log(`- "${keyword}" 연관 검색어: ${relatedQueries.length}개`);
    console.log(`- 상위 5개:`, relatedQueries.slice(0, 5));
    
    console.log('\n=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('테스트 실패:', error);
    console.error('SERPAPI_KEY 환경 변수가 설정되었는지 확인하세요.');
  }
}

// 테스트 실행
testSerpApiTrends();
```

#### 5.2 실행 명령어
```bash
# 환경 변수 설정 (필수)
echo 'SERPAPI_KEY=your_serpapi_key_here' >> .env.local

# 테스트 스크립트 실행
pnpm tsx scripts/testGoogleTrends.ts

# API Route 테스트
curl http://localhost:3000/api/google/trends

# 실시간 트렌드 조회
curl "http://localhost:3000/api/google/trends?type=realtime"

# 특정 키워드 트렌드 조회
curl -X POST http://localhost:3000/api/google/trends \
  -H "Content-Type: application/json" \
  -d '{"keyword": "챗GPT", "timeframe": "7d"}'
```

## 🔍 트러블슈팅

### 1. API 키 오류 발생 시
```typescript
// .env.local 파일 확인
SERPAPI_KEY=your_actual_api_key_here

// 키 유효성 검사
if (!process.env.SERPAPI_KEY) {
  throw new Error('SERPAPI_KEY 환경 변수가 설정되지 않았습니다.');
}
```

### 2. 사용량 초과 및 에러 핸들링
```typescript
// HTTP 상태 코드 기반 에러 핸들링
try {
  const results = await getJson({...});
} catch (error) {
  if (error.status === 429) {
    console.error('SerpAPI 사용량 초과 또는 요청 제한 초과');
    // 캐시 데이터 사용 또는 사용자에게 알림
  } else if (error.status === 401) {
    console.error('SerpAPI 인증 실패: API 키를 확인하세요');
  } else if (error.status === 403) {
    console.error('SerpAPI 계정 권한 부족 또는 계정 삭제됨');
  }
  throw error;
}
```

### 3. Rate Limiting 대응
```typescript
// 재시도 로직 추가
async function withRetry<T>(
  fn: () => Promise<T>, 
  retries: number = 3,
  delay: number = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.status === 429) {
      console.log(`Rate limit 대기 중... (${retries}회 남음)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
```

### 4. 한국 데이터 없는 경우
```typescript
// 기본값 처리
const defaultResponse: SerpTrendsResponse = {
  date: new Date().toISOString(),
  trends: [],
  searchMetadata: {}
};
```

## ✅ Day 4 체크리스트

### 완료 항목
- [ ] SerpAPI 계정 생성 및 API 키 발급
- [ ] serpapi 패키지 설치
- [ ] 환경 변수 설정 (SERPAPI_KEY)
- [ ] 타입 정의 완료
- [ ] 서비스 클래스 구현
- [ ] 데이터 변환 로직 구현
- [ ] API Route 구현
- [ ] 캐싱 로직 추가
- [ ] 테스트 스크립트 작성
- [ ] 에러 핸들링 구현

### 테스트 항목
- [ ] 일일 트렌드 수집 성공
- [ ] 실시간 트렌드 수집 성공
- [ ] 키워드 관심도 조회 성공
- [ ] 연관 검색어 조회 성공
- [ ] 한국 데이터 조회 확인 (geo=KR)
- [ ] 데이터베이스 저장 확인
- [ ] 캐싱 동작 확인
- [ ] 월 사용량 모니터링

## 📝 다음 단계 (Day 5)
- YouTube API 연동
- 동영상 메타데이터에서 키워드 추출
- 플랫폼 간 데이터 통합 로직 구현
