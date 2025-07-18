# Day 6: 통합 및 배포 가이드

## 📋 개요
프로젝트의 마지막 단계로, 모든 API를 통합하고 Vercel에 배포하여 완전한 MVP를 완성합니다.

## 🎯 Day 6 목표
- 모든 데이터 소스 통합 API 구현
- 데이터 중복 제거 및 점수 계산 최적화
- Vercel 배포 및 환경 설정
- 기본 문서화
- 통합 테스트 및 성능 최적화

### 주요 목표
1. ✅ 통합 데이터 수집 API 구현
2. ✅ 데이터 통합 및 점수 계산 로직
3. ✅ 배포 설정 및 환경 변수 관리
4. ✅ 에러 핸들링 및 모니터링
5. ✅ 성능 최적화 및 캐싱

## 🎯 작업 단위별 구현 가이드

### 작업 1: 통합 데이터 수집 API 구현 (1시간)

#### 1.1 통합 수집 API 엔드포인트
```typescript
// app/api/collect/all/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { NaverApi } from '@/lib/services/naverApi';
import { GoogleTrendsService } from '@/lib/services/googleTrends';
import { LongtailGenerator } from '@/lib/services/longtailGenerator';

export async function POST() {
  try {
    console.log('Starting integrated data collection...');
    
    // 수집할 키워드 목록
    const targetKeywords = [
      '블로그', 'SEO', '키워드 마케팅', '구글 애널리틱스', '디지털 마케팅',
      '콘텐츠 마케팅', '소셜미디어 마케팅', '이메일 마케팅', '온라인 광고', '검색엔진 최적화'
    ];

    const naverApi = new NaverApi();
    const googleTrends = new GoogleTrendsService();
    const longtailGenerator = new LongtailGenerator();
    
    const results = [];
    
    for (const keyword of targetKeywords) {
      try {
        console.log(`Processing keyword: ${keyword}`);
        
        // 1. 네이버 데이터 수집
        const naverData = await naverApi.getKeywordData(keyword);
        
        // 2. Google Trends 데이터 수집
        const googleData = await googleTrends.getKeywordTrends(keyword);
        
        // 3. 롱테일 키워드 생성
        const longtailKeywords = await longtailGenerator.generateLongtailKeywords(keyword);
        
        // 4. 데이터 통합 및 점수 계산
        const integratedData = await integrateKeywordData(keyword, naverData, googleData, longtailKeywords);
        
        results.push(integratedData);
        
        // Rate limiting 방지
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing ${keyword}:`, error);
        // 에러 발생 시에도 계속 진행
        continue;
      }
    }
    
    // 5. 데이터베이스에 저장
    const savedData = await saveIntegratedData(results);
    
    return NextResponse.json({
      success: true,
      message: `Successfully collected ${results.length} keywords`,
      data: savedData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Integration error:', error);
    return NextResponse.json(
      { error: 'Failed to collect integrated data', details: error.message },
      { status: 500 }
    );
  }
}

async function integrateKeywordData(keyword: string, naverData: any, googleData: any, longtailKeywords: any[]) {
  // 데이터 통합 로직
  const integrated = {
    keyword,
    naver_volume: naverData?.searchVolume || 0,
    naver_competition: naverData?.competition || '중간',
    naver_cpc: naverData?.cpc || 0,
    google_score: calculateGoogleScore(googleData),
    google_trend: googleData?.trend || 'stable',
    longtail_count: longtailKeywords?.length || 0,
    total_score: 0,
    created_at: new Date().toISOString()
  };
  
  // 종합 점수 계산
  integrated.total_score = calculateTotalScore(integrated);
  
  return integrated;
}

async function saveIntegratedData(results: any[]) {
  // 기존 데이터 삭제 (테스트용)
  await supabase.from('keywords').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // 새 데이터 삽입
  const { data, error } = await supabase
    .from('keywords')
    .insert(results.map(r => ({
      keyword: r.keyword,
      search_volume: r.naver_volume,
      competition_level: r.naver_competition,
      cpc: r.naver_cpc,
      score: r.total_score,
      platform: 'integrated',
      google_score: r.google_score,
      trend_direction: r.google_trend,
      longtail_count: r.longtail_count
    })))
    .select();
  
  if (error) throw error;
  return data;
}

function calculateGoogleScore(googleData: any): number {
  if (!googleData?.interest_over_time?.length) return 0;
  
  // 최근 데이터 기반 점수 계산
  const recentData = googleData.interest_over_time.slice(-5);
  const avgInterest = recentData.reduce((sum: number, item: any) => 
    sum + (item.value || 0), 0) / recentData.length;
  
  return Math.floor(avgInterest);
}

function calculateTotalScore(data: any): number {
  let score = 0;
  
  // 네이버 검색량 (40%)
  const volume = data.naver_volume || 0;
  if (volume > 100000) score += 40;
  else if (volume > 50000) score += 30;
  else if (volume > 10000) score += 20;
  else if (volume > 1000) score += 10;
  
  // 경쟁도 (30%)
  switch (data.naver_competition) {
    case '낮음': score += 30; break;
    case '중간': score += 20; break;
    case '높음': score += 10; break;
  }
  
  // Google 점수 (20%)
  score += Math.floor((data.google_score || 0) * 0.2);
  
  // 롱테일 키워드 개수 (10%)
  score += Math.min(data.longtail_count || 0, 10);
  
  return Math.min(score, 100);
}
```

#### 1.2 상태 모니터링 API
```typescript
// app/api/collect/status/route.ts
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
    const { data: stats } = await supabase
      .from('keywords')
      .select('platform, competition_level, count(*)')
      .group('platform, competition_level');
    
    // 수집 상태 정보
    const status = {
      lastCollection: recentCollection?.[0]?.created_at || null,
      totalKeywords: stats?.reduce((sum, item) => sum + item.count, 0) || 0,
      platformStats: stats || [],
      isHealthy: checkSystemHealth(),
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(status);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get collection status' },
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
```

### 작업 2: 배포 설정 및 환경 관리 (45분)

#### 2.1 Vercel 배포 설정
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "NAVER_API_KEY": "@naver_api_key",
    "NAVER_SECRET_KEY": "@naver_secret_key",
    "NAVER_CUSTOMER_ID": "@naver_customer_id",
    "SERPAPI_KEY": "@serpapi_key"
  },
  "functions": {
    "app/api/collect/all/route.ts": {
      "maxDuration": 60
    },
    "app/api/google/trends/route.ts": {
      "maxDuration": 30
    },
    "app/api/naver/keyword/route.ts": {
      "maxDuration": 30
    }
  }
}
```

#### 2.2 환경 변수 관리
```bash
# .env.local (개발용)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NAVER_API_KEY=your-naver-api-key
NAVER_SECRET_KEY=your-naver-secret-key
NAVER_CUSTOMER_ID=your-customer-id
SERPAPI_KEY=your-serpapi-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# .env.production (배포용 - Vercel 환경변수로 설정)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NAVER_API_KEY=your-naver-api-key
NAVER_SECRET_KEY=your-naver-secret-key
NAVER_CUSTOMER_ID=your-customer-id
SERPAPI_KEY=your-serpapi-key
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

#### 2.3 배포 스크립트
```json
// package.json scripts 추가
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "deploy": "vercel --prod",
    "deploy-preview": "vercel",
    "env-check": "node scripts/env-check.js",
    "test-apis": "node scripts/test-apis.js"
  }
}
```

```javascript
// scripts/env-check.js
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NAVER_API_KEY',
  'NAVER_SECRET_KEY',
  'NAVER_CUSTOMER_ID',
  'SERPAPI_KEY'
];

console.log('🔍 Environment Variables Check:');
let allPresent = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  const status = value ? '✅' : '❌';
  console.log(`${status} ${envVar}: ${value ? 'Present' : 'Missing'}`);
  if (!value) allPresent = false;
});

console.log(allPresent ? '\n✅ All environment variables are present!' : '\n❌ Some environment variables are missing!');
process.exit(allPresent ? 0 : 1);
```

### 작업 3: 에러 핸들링 및 모니터링 (30분)

#### 3.1 글로벌 에러 핸들러
```typescript
// lib/utils/errorHandler.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }
  
  // 네이버 API 에러
  if (error.response?.data?.errorCode) {
    return {
      error: `Naver API Error: ${error.response.data.errorMessage}`,
      code: error.response.data.errorCode,
      statusCode: 400
    };
  }
  
  // SerpAPI 에러
  if (error.response?.data?.error) {
    return {
      error: `SerpAPI Error: ${error.response.data.error}`,
      code: 'SERPAPI_ERROR',
      statusCode: 400
    };
  }
  
  // 기본 에러
  return {
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  };
}
```

#### 3.2 API 로깅 미들웨어
```typescript
// lib/middleware/apiLogger.ts
export function logApiCall(endpoint: string, method: string, params?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${endpoint}`, params ? JSON.stringify(params) : '');
}

export function logApiResponse(endpoint: string, success: boolean, duration: number, error?: any) {
  const timestamp = new Date().toISOString();
  const status = success ? '✅' : '❌';
  console.log(`[${timestamp}] ${status} ${endpoint} - ${duration}ms`, error ? error.message : '');
}
```

### 작업 4: 성능 최적화 및 캐싱 (45분)

#### 4.1 Redis 캐싱 (선택사항)
```typescript
// lib/services/cacheService.ts
import { createClient } from 'redis';

class CacheService {
  private client: any;
  private isConnected = false;
  
  constructor() {
    if (process.env.REDIS_URL) {
      this.client = createClient({
        url: process.env.REDIS_URL
      });
      
      this.client.on('error', (err: any) => {
        console.error('Redis Client Error:', err);
      });
      
      this.connect();
    }
  }
  
  async connect() {
    if (!this.client || this.isConnected) return;
    
    try {
      await this.client.connect();
      this.isConnected = true;
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection failed:', error);
    }
  }
  
  async get(key: string): Promise<any> {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
}

export const cacheService = new CacheService();
```

#### 4.2 메모리 캐싱 (기본)
```typescript
// lib/services/memoryCache.ts
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  
  constructor() {
    // 5분마다 만료된 캐시 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
  
  set(key: string, data: any, ttl: number = 3600): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000
    });
  }
  
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const memoryCache = new MemoryCache();
```

#### 4.3 API Rate Limiting
```typescript
// lib/middleware/rateLimiter.ts
import { memoryCache } from '@/lib/services/memoryCache';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitInfo> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60 * 1000 // 1분
  ) {}
  
  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    
    let info = this.limits.get(key);
    
    if (!info || now > info.resetTime) {
      info = {
        count: 0,
        resetTime: now + this.windowMs
      };
    }
    
    info.count++;
    this.limits.set(key, info);
    
    const allowed = info.count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - info.count);
    
    return {
      allowed,
      remaining,
      resetTime: info.resetTime
    };
  }
}

export const rateLimiter = new RateLimiter();
```

### 작업 5: 헬스 체크 및 모니터링 (30분)

#### 5.1 헬스 체크 API
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // 데이터베이스 연결 확인
    const { data: dbHealth, error: dbError } = await supabase
      .from('keywords')
      .select('count(*)')
      .limit(1);
    
    // 환경 변수 확인
    const envCheck = {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      naver: !!process.env.NAVER_API_KEY,
      serpapi: !!process.env.SERPAPI_KEY,
    };
    
    // 최근 데이터 수집 확인
    const { data: recentData } = await supabase
      .from('keywords')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    const lastCollection = recentData?.[0]?.created_at;
    const timeSinceLastCollection = lastCollection ? 
      Date.now() - new Date(lastCollection).getTime() : null;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: !dbError,
        error: dbError?.message || null
      },
      environment: envCheck,
      lastCollection: {
        timestamp: lastCollection,
        timeSinceMs: timeSinceLastCollection,
        isRecent: timeSinceLastCollection ? timeSinceLastCollection < 24 * 60 * 60 * 1000 : false
      },
      responseTime: Date.now() - startTime
    };
    
    // 전체 상태 판정
    const isHealthy = !dbError && 
      Object.values(envCheck).every(v => v) &&
      (health.lastCollection.isRecent || !lastCollection);
    
    return NextResponse.json(health, { 
      status: isHealthy ? 200 : 503 
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
```

#### 5.2 성능 모니터링
```typescript
// lib/utils/performance.ts
interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  
  startTiming(operation: string): () => void {
    const start = Date.now();
    
    return (success: boolean = true, error?: string) => {
      const duration = Date.now() - start;
      
      this.metrics.push({
        operation,
        duration,
        timestamp: Date.now(),
        success,
        error
      });
      
      // 최대 개수 초과 시 오래된 메트릭 제거
      if (this.metrics.length > this.maxMetrics) {
        this.metrics = this.metrics.slice(-this.maxMetrics);
      }
      
      // 느린 요청 로깅
      if (duration > 5000) {
        console.warn(`Slow operation: ${operation} took ${duration}ms`);
      }
    };
  }
  
  getMetrics(operation?: string): PerformanceMetric[] {
    return operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;
  }
  
  getAverageResponseTime(operation?: string): number {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }
  
  getErrorRate(operation?: string): number {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return 0;
    
    const errors = metrics.filter(m => !m.success).length;
    return errors / metrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

## 🚀 배포 프로세스

### 1단계: 로컬 테스트
```bash
# 환경 변수 확인
npm run env-check

# 로컬 빌드 테스트
npm run build

# API 테스트
npm run test-apis

# 개발 서버 실행
npm run dev
```

### 2단계: Vercel 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 링크
vercel link

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NAVER_API_KEY
vercel env add NAVER_SECRET_KEY
vercel env add NAVER_CUSTOMER_ID
vercel env add SERPAPI_KEY

# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 3단계: 배포 후 검증
```bash
# 헬스 체크
curl https://your-project.vercel.app/api/health

# 데이터 수집 테스트
curl -X POST https://your-project.vercel.app/api/collect/all

# 상태 확인
curl https://your-project.vercel.app/api/collect/status
```

## 📊 모니터링 및 알림

### 1. Vercel 모니터링 설정
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { performanceMonitor } from '@/lib/utils/performance';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  return NextResponse.next().then((response) => {
    const duration = Date.now() - startTime;
    
    // API 호출 모니터링
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const operation = request.nextUrl.pathname;
      const success = response.status < 400;
      
      performanceMonitor.startTiming(operation)(success, 
        success ? undefined : `HTTP ${response.status}`);
    }
    
    return response;
  });
}

export const config = {
  matcher: '/api/:path*'
};
```

### 2. 로그 집계 및 모니터링
```typescript
// lib/utils/logger.ts
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  private log(level: LogLevel, message: string, context?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    };
    
    this.logs.push(entry);
    
    // 최대 로그 개수 제한
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // 콘솔 출력
    const logFn = console[level] || console.log;
    logFn(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, 
      context ? JSON.stringify(context) : '',
      error ? error.stack : '');
  }
  
  error(message: string, error?: Error, context?: any) {
    this.log(LogLevel.ERROR, message, context, error);
  }
  
  warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context);
  }
  
  info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context);
  }
  
  debug(message: string, context?: any) {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  getLogs(level?: LogLevel): LogEntry[] {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }
}

export const logger = new Logger();
```

## 🔧 트러블슈팅 가이드

### 배포 관련 문제

#### 1. 빌드 실패
```bash
# 타입 에러 무시 설정 확인
# next.config.ts에서 typescript.ignoreBuildErrors: true 확인

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 빌드 재시도
npm run build
```

#### 2. 환경 변수 누락
```bash
# Vercel 환경 변수 확인
vercel env ls

# 로컬 환경 변수 확인
npm run env-check
```

#### 3. API 타임아웃
```typescript
// vercel.json에서 함수 타임아웃 설정
{
  "functions": {
    "app/api/collect/all/route.ts": {
      "maxDuration": 300  // 5분
    }
  }
}
```

### 성능 관련 문제

#### 1. 느린 API 응답
- 캐싱 구현 확인
- 데이터베이스 쿼리 최적화
- 외부 API 호출 병렬 처리

#### 2. 메모리 사용량 증가
- 캐시 정리 로직 확인
- 메모리 누수 점검
- 가비지 컬렉션 모니터링

## 📋 배포 완료 체크리스트

### 필수 확인 사항
- [ ] 모든 환경 변수 설정 완료
- [ ] 헬스 체크 API 정상 동작
- [ ] 데이터 수집 API 정상 동작
- [ ] 대시보드 UI 정상 표시
- [ ] 모바일 반응형 확인
- [ ] 에러 페이지 정상 표시

### 성능 확인 사항
- [ ] 초기 로딩 시간 < 3초
- [ ] API 응답 시간 < 5초
- [ ] 메모리 사용량 안정적
- [ ] 에러율 < 5%

### 모니터링 확인 사항
- [ ] 로그 정상 수집
- [ ] 성능 메트릭 수집
- [ ] 알림 설정 (선택사항)
- [ ] 백업 및 복구 계획

## 🎯 다음 단계 (Phase 2)

### 개선 사항
1. **자동화 스케줄링**
   - Cron 작업 설정
   - 주기적 데이터 수집
   - 자동 백업

2. **고급 분석 기능**
   - 트렌드 분석
   - 예측 모델
   - 사용자 맞춤 추천

3. **사용자 경험 개선**
   - 실시간 알림
   - 개인화 대시보드
   - 고급 필터링

4. **확장성 개선**
   - 마이크로서비스 아키텍처
   - 로드 밸런싱
   - 데이터베이스 샤딩

---

**Day 6 완료 기준: 완전히 작동하는 MVP가 프로덕션 환경에서 안정적으로 동작하는 것** 🚀
import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### 1.2 헤더 컴포넌트
```typescript
// components/layout/Header.tsx
import { useState } from 'react';
import { RefreshCw, Settings, Menu } from 'lucide-react';

export default function Header() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // API 호출 로직
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            키워드 트렌드 대시보드
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

### 작업 2: 대시보드 메인 컴포넌트 (1시간)

#### 2.1 대시보드 페이지
```typescript
// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import KeywordCard from '@/components/dashboard/KeywordCard';
import FilterBar from '@/components/dashboard/FilterBar';
import StatsOverview from '@/components/dashboard/StatsOverview';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('totalScore');

  useEffect(() => {
    fetchKeywords();
  }, [filter, sortBy]);

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/keywords?filter=${filter}&sort=${sortBy}`);
      const data = await response.json();
      setKeywords(data.keywords);
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <StatsOverview />
        
        <FilterBar 
          filter={filter}
          sortBy={sortBy}
          onFilterChange={setFilter}
          onSortChange={setSortBy}
        />
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-4">
            {keywords.map((keyword) => (
              <KeywordCard key={keyword.id} keyword={keyword} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
```

#### 2.2 통계 오버뷰 컴포넌트
```typescript
// components/dashboard/StatsOverview.tsx
import { TrendingUp, Search, Target, DollarSign } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function StatsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="총 키워드"
        value="1,234"
        change="+12%"
        icon={<Search className="h-6 w-6 text-white" />}
        color="bg-blue-500"
      />
      <StatCard
        title="급상승 키워드"
        value="89"
        change="+34%"
        icon={<TrendingUp className="h-6 w-6 text-white" />}
        color="bg-green-500"
      />
      <StatCard
        title="낮은 경쟁도"
        value="456"
        icon={<Target className="h-6 w-6 text-white" />}
        color="bg-purple-500"
      />
      <StatCard
        title="평균 CPC"
        value="₩450"
        change="-5%"
        icon={<DollarSign className="h-6 w-6 text-white" />}
        color="bg-orange-500"
      />
    </div>
  );
}
```

### 작업 3: 키워드 카드 컴포넌트 (1시간)

#### 3.1 키워드 카드
```typescript
// components/dashboard/KeywordCard.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, TrendingUp, Globe, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KeywordData {
  id: number;
  keyword: string;
  googleScore: number;
  naverVolume: number;
  totalScore: number;
  competitionLevel: string;
  cpc: number;
  trendDirection: string;
  longtailKeywords?: Array<{
    keyword: string;
    volume: number;
  }>;
}

export default function KeywordCard({ keyword }: { keyword: KeywordData }) {
  const [expanded, setExpanded] = useState(false);
  
  const getCompetitionColor = (level: string) => {
    switch (level) {
      case '낮음': return 'bg-green-100 text-green-800';
      case '중간': return 'bg-yellow-100 text-yellow-800';
      case '높음': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'rising') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (direction === 'falling') return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <span className="h-4 w-4 text-gray-400">−</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* 메인 정보 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{keyword.keyword}</h3>
              {keyword.trendDirection === 'rising' && (
                <Badge variant="destructive" className="bg-red-500">
                  🔥 급상승
                </Badge>
              )}
            </div>
            
            {/* 플랫폼별 점수 */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Google: {keyword.googleScore > 0 ? `${keyword.googleScore}점` : '데이터 없음'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  네이버: {keyword.naverVolume.toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* 메타 정보 */}
            <div className="flex items-center gap-4 mt-4">
              <Badge className={getCompetitionColor(keyword.competitionLevel)}>
                경쟁도: {keyword.competitionLevel}
              </Badge>
              <span className="text-sm text-gray-600">CPC: ₩{keyword.cpc}</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(keyword.trendDirection)}
                <span className="text-sm text-gray-600">
                  {keyword.trendDirection === 'rising' ? '상승중' : 
                   keyword.trendDirection === 'falling' ? '하락중' : '안정적'}
                </span>
              </div>
            </div>
          </div>
          
          {/* 점수 및 액션 */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {keyword.totalScore}
              </div>
              <div className="text-xs text-gray-500">종합점수</div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Star className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* 롱테일 키워드 토글 */}
        {keyword.longtailKeywords && keyword.longtailKeywords.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            롱테일 키워드 {keyword.longtailKeywords.length}개
          </button>
        )}
      </div>
      
      {/* 롱테일 키워드 목록 */}
      {expanded && keyword.longtailKeywords && (
        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {keyword.longtailKeywords.map((lt, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{lt.keyword}</span>
                <span className="text-gray-500">({lt.volume.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 작업 4: 필터 및 정렬 컴포넌트 (45분)

#### 4.1 필터바 컴포넌트
```typescript
// components/dashboard/FilterBar.tsx
import { Filter, SortAsc, Download } from 'lucide-react';

interface FilterBarProps {
  filter: string;
  sortBy: string;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
}

export default function FilterBar({ filter, sortBy, onFilterChange, onSortChange }: FilterBarProps) {
  const filters = [
    { value: 'all', label: '전체' },
    { value: 'rising', label: '급상승' },
    { value: 'stable', label: '안정적' },
    { value: 'longtail', label: '롱테일' },
    { value: 'lowCompetition', label: '낮은 경쟁도' }
  ];

  const sortOptions = [
    { value: 'totalScore', label: '종합점수' },
    { value: 'naverVolume', label: '검색량' },
    { value: 'cpc', label: 'CPC' },
    { value: 'createdAt', label: '최신순' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 필터 */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => onFilterChange(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 정렬 및 액션 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SortAsc className="h-5 w-5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
            <Download className="h-4 w-4" />
            CSV 내보내기
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 작업 5: 반응형 사이드바 (45분)

#### 5.1 사이드바 컴포넌트
```typescript
// components/layout/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Search, 
  BookmarkPlus,
  Settings,
  ChevronLeft
} from 'lucide-react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: '대시보드', href: '/dashboard' },
    { icon: TrendingUp, label: 'Google 트렌드', href: '/trends/google' },
    { icon: Search, label: '네이버 키워드', href: '/trends/naver' },
    { icon: BookmarkPlus, label: '북마크', href: '/bookmarks' },
    { icon: Settings, label: '설정', href: '/settings' }
  ];

  return (
    <aside className={`bg-white border-r transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="h-full flex flex-col">
        <div className="p-4 flex justify-end">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${
              collapsed ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
        
        <nav className="flex-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* 수집 상태 */}
        {!collapsed && (
          <div className="p-4 border-t">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">자동 수집</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
              <div className="text-xs text-gray-500">
                마지막 수집: 5분 전
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
```

### 작업 6: API 엔드포인트 통합 (30분)

#### 6.1 키워드 목록 API
```typescript
// app/api/keywords/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get('filter') || 'all';
  const sortBy = searchParams.get('sort') || 'totalScore';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabase
      .from('keywords')
      .select(`
        *,
        longtail_keywords (
          id,
          longtail_keyword,
          search_volume
        )
      `);

    // 필터 적용
    switch (filter) {
      case 'rising':
        query = query.eq('trend_direction', 'rising');
        break;
      case 'stable':
        query = query.eq('trend_direction', 'stable');
        break;
      case 'lowCompetition':
        query = query.eq('competition_level', '낮음');
        break;
      case 'longtail':
        query = query.not('longtail_keywords', 'is', null);
        break;
    }

    // 정렬 적용
    const sortColumn = sortBy === 'totalScore' ? 'total_score' : 
                      sortBy === 'naverVolume' ? 'naver_volume' :
                      sortBy === 'createdAt' ? 'created_at' : sortBy;
    
    query = query.order(sortColumn, { ascending: false });

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // 데이터 변환
    const keywords = data?.map(item => ({
      id: item.id,
      keyword: item.keyword,
      googleScore: item.google_score || 0,
      naverVolume: item.naver_volume || 0,
      totalScore: item.total_score || 0,
      competitionLevel: item.competition_level || '중간',
      cpc: item.cpc || 0,
      trendDirection: item.trend_direction || 'stable',
      longtailKeywords: item.longtail_keywords?.map((lt: any) => ({
        keyword: lt.longtail_keyword,
        volume: lt.search_volume
      })) || []
    })) || [];

    return NextResponse.json({
      keywords,
      total: count || 0,
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
```

### 작업 7: 로딩 및 에러 상태 처리 (30분)

#### 7.1 로딩 스피너
```typescript
// components/common/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-blue-100"></div>
        </div>
      </div>
    </div>
  );
}
```

#### 7.2 에러 컴포넌트
```typescript
// components/common/ErrorMessage.tsx
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-800 underline mt-2"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 작업 8: 모바일 반응형 처리 (30분)

#### 8.1 반응형 유틸리티 훅
```typescript
// hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);

  return matches;
}

// hooks/useResponsive.ts
import { useMediaQuery } from './useMediaQuery';

export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return { isMobile, isTablet, isDesktop };
}
```

## 🧪 테스트 체크리스트

### UI 컴포넌트 테스트
- [ ] 대시보드 페이지 정상 로드
- [ ] 키워드 목록 표시
- [ ] 필터 기능 동작
- [ ] 정렬 기능 동작
- [ ] 롱테일 키워드 토글
- [ ] 반응형 레이아웃 (모바일/태블릿/데스크톱)

### 상태 관리 테스트
- [ ] 로딩 상태 표시
- [ ] 에러 상태 처리
- [ ] 데이터 새로고침
- [ ] 필터/정렬 상태 유지

### 성능 테스트
- [ ] 초기 로드 시간 < 3초
- [ ] 키워드 목록 스크롤 성능
- [ ] 애니메이션 부드러움

## 📋 Day 7 완료 기준

### 필수 완료 항목
1. ✅ 메인 대시보드 UI 구현 완료
2. ✅ 키워드 카드 컴포넌트 완성
3. ✅ 필터 및 정렬 기능 구현
4. ✅ 반응형 디자인 적용
5. ✅ API 연동 및 데이터 표시

### 추가 구현 항목 (시간 여유시)
- [ ] 다크 모드 지원
- [ ] 키워드 북마크 기능
- [ ] CSV 내보내기 기능
- [ ] 무한 스크롤 구현

## 🎯 Phase 1 완료 및 다음 단계

### Phase 1 성과 정리
- Day 1: 프로젝트 설정 및 Supabase 구축 ✅
- Day 2: 네이버 검색광고 API 연동 ✅
- Day 3: 네이버 자동완성 구현 ✅
- Day 4: Google Trends 연동 ✅
- Day 6: 데이터 통합 로직 ✅
- Day 7: 기본 UI 구현 ✅

### Phase 2 예고 (Week 2)
- Day 8-9: 롱테일 키워드 자동 확장 기능
- Day 10-11: 자동화 스케줄링 구현
- Day 12-13: 고급 필터링 및 분석 기능
- Day 14: 성능 최적화 및 테스트

## 💡 개발 팁

### 컴포넌트 구조화
```
components/
├── layout/          # 레이아웃 관련
├── dashboard/       # 대시보드 전용
├── common/          # 공통 컴포넌트
└── ui/             # 기본 UI 컴포넌트
```

### 상태 관리 전략
- 서버 상태: React Query 또는 SWR 고려
- 클라이언트 상태: useState, useReducer
- 전역 상태: Context API 또는 Zustand

### 성능 최적화
- 키워드 목록 가상화 (react-window)
- 이미지 최적화 (next/image)
- 코드 스플리팅
- 메모이제이션 활용

---

**Day 7 목표: Phase 1을 완성하는 기본 UI 구현으로 실제 사용 가능한 MVP 완성!** 🎉
