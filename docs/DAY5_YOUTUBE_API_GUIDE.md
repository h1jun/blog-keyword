# Day 5: YouTube API 연동 가이드

## 📋 개요
YouTube Data API v3를 사용하여 인기 동영상에서 트렌드 키워드를 추출하는 기능을 구현합니다.

## 🎯 Day 5 목표
- YouTube API 설정 및 인증
- 인기 동영상 데이터 수집
- 동영상 메타데이터에서 키워드 추출
- 데이터 정규화 및 저장

## 📚 사전 준비

### 1. Google Cloud Console 설정 (30분)
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "라이브러리"에서 "YouTube Data API v3" 검색
4. API 활성화
5. "사용자 인증 정보" → "사용자 인증 정보 만들기" → "API 키" 생성
6. API 키 복사 후 환경 변수에 추가

### 2. 환경 변수 설정
```bash
# .env.local에 추가
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. 패키지 설치
```bash
# Google API 공식 클라이언트
pnpm add googleapis

# 한글 형태소 분석기 (키워드 추출용)
pnpm add hangul-js
```

## 🔧 구현 단계

### Step 1: YouTube API 타입 정의 (30분)

#### 1.1 타입 정의 파일 생성
```typescript
// lib/types/youtube.ts
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  tags: string[];
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  categoryId: string;
}

export interface YouTubeKeyword {
  keyword: string;
  frequency: number;
  source: 'title' | 'tags' | 'description';
  videos: string[]; // 비디오 ID 목록
}

export interface YouTubeCategory {
  id: string;
  title: string;
}

export const YOUTUBE_CATEGORIES: YouTubeCategory[] = [
  { id: '1', title: '영화/애니메이션' },
  { id: '2', title: '자동차' },
  { id: '10', title: '음악' },
  { id: '15', title: '애완동물/동물' },
  { id: '17', title: '스포츠' },
  { id: '19', title: '여행/이벤트' },
  { id: '20', title: '게임' },
  { id: '22', title: '사람/블로그' },
  { id: '23', title: '코미디' },
  { id: '24', title: '엔터테인먼트' },
  { id: '25', title: '뉴스/정치' },
  { id: '26', title: '노하우/스타일' },
  { id: '27', title: '교육' },
  { id: '28', title: '과학기술' },
];
```

### Step 2: YouTube 서비스 구현 (1시간 30분)

#### 2.1 YouTube API 서비스 클래스
```typescript
// lib/services/youtubeApi.ts
import { google, youtube_v3 } from 'googleapis';
import type { YouTubeVideo, YouTubeKeyword } from '@/lib/types/youtube';

export class YouTubeApiService {
  private youtube: youtube_v3.Youtube;
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY!;
    if (!this.apiKey) {
      throw new Error('YouTube API 키가 설정되지 않았습니다.');
    }
    
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.apiKey
    });
  }
  
  /**
   * 인기 급상승 동영상 가져오기
   */
  async getTrendingVideos(
    maxResults: number = 50,
    categoryId?: string
  ): Promise<YouTubeVideo[]> {
    try {
      console.log('YouTube 인기 동영상 수집 시작...');
      
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        chart: 'mostPopular',
        regionCode: 'KR',
        maxResults,
        videoCategoryId: categoryId,
      });
      
      if (!response.data.items) {
        console.log('동영상이 없습니다.');
        return [];
      }
      
      const videos: YouTubeVideo[] = response.data.items.map(item => ({
        id: item.id!,
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        tags: item.snippet?.tags || [],
        publishedAt: item.snippet?.publishedAt || '',
        channelTitle: item.snippet?.channelTitle || '',
        channelId: item.snippet?.channelId || '',
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        likeCount: parseInt(item.statistics?.likeCount || '0'),
        commentCount: parseInt(item.statistics?.commentCount || '0'),
        categoryId: item.snippet?.categoryId || '',
      }));
      
      console.log(`${videos.length}개의 동영상 수집 완료`);
      return videos;
      
    } catch (error) {
      console.error('YouTube API 오류:', error);
      throw new Error('YouTube 동영상 수집 실패');
    }
  }
  
  /**
   * 특정 채널의 최신 동영상 가져오기
   */
  async getChannelVideos(
    channelId: string,
    maxResults: number = 10
  ): Promise<YouTubeVideo[]> {
    try {
      const response = await this.youtube.search.list({
        part: ['id'],
        channelId,
        order: 'date',
        type: ['video'],
        maxResults,
      });
      
      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }
      
      const videoIds = response.data.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];
      
      return this.getVideosByIds(videoIds);
      
    } catch (error) {
      console.error('채널 동영상 조회 오류:', error);
      return [];
    }
  }
  
  /**
   * 비디오 ID로 상세 정보 가져오기
   */
  async getVideosByIds(videoIds: string[]): Promise<YouTubeVideo[]> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: videoIds,
      });
      
      if (!response.data.items) {
        return [];
      }
      
      return response.data.items.map(item => ({
        id: item.id!,
        title: item.snippet?.title || '',
        description: item.snippet?.description || '',
        tags: item.snippet?.tags || [],
        publishedAt: item.snippet?.publishedAt || '',
        channelTitle: item.snippet?.channelTitle || '',
        channelId: item.snippet?.channelId || '',
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        likeCount: parseInt(item.statistics?.likeCount || '0'),
        commentCount: parseInt(item.statistics?.commentCount || '0'),
        categoryId: item.snippet?.categoryId || '',
      }));
      
    } catch (error) {
      console.error('비디오 상세 정보 조회 오류:', error);
      return [];
    }
  }
  
  /**
   * 검색어로 동영상 검색
   */
  async searchVideos(
    query: string,
    maxResults: number = 25
  ): Promise<YouTubeVideo[]> {
    try {
      const response = await this.youtube.search.list({
        part: ['id'],
        q: query,
        type: ['video'],
        order: 'relevance',
        regionCode: 'KR',
        maxResults,
      });
      
      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }
      
      const videoIds = response.data.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];
      
      return this.getVideosByIds(videoIds);
      
    } catch (error) {
      console.error('동영상 검색 오류:', error);
      return [];
    }
  }
}

// 싱글톤 인스턴스
export const youtubeApiService = new YouTubeApiService();
```

### Step 3: 키워드 추출 로직 구현 (1시간)

#### 3.1 키워드 추출기
```typescript
// lib/services/keywordExtractor.ts
import type { YouTubeVideo, YouTubeKeyword } from '@/lib/types/youtube';

export class KeywordExtractor {
  private stopWords: Set<string>;
  
  constructor() {
    // 불용어 목록 (의미없는 단어들)
    this.stopWords = new Set([
      '그리고', '하지만', '그러나', '그래서', '따라서', '이런', '저런',
      '이것', '저것', '여기', '거기', '우리', '너희', '이거', '그거',
      '있다', '없다', '하다', '되다', '이다', '아니다', '같다',
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an',
    ]);
  }
  
  /**
   * 동영상 목록에서 키워드 추출
   */
  extractKeywords(videos: YouTubeVideo[]): YouTubeKeyword[] {
    const keywordMap = new Map<string, YouTubeKeyword>();
    
    videos.forEach(video => {
      // 제목에서 키워드 추출
      const titleKeywords = this.extractFromText(video.title);
      this.addKeywords(keywordMap, titleKeywords, 'title', video.id);
      
      // 태그에서 키워드 추출
      const tagKeywords = this.normalizeKeywords(video.tags);
      this.addKeywords(keywordMap, tagKeywords, 'tags', video.id);
      
      // 설명에서 키워드 추출 (첫 200자만)
      const shortDescription = video.description.substring(0, 200);
      const descKeywords = this.extractFromText(shortDescription);
      this.addKeywords(keywordMap, descKeywords, 'description', video.id);
    });
    
    // 빈도수로 정렬
    return Array.from(keywordMap.values())
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * 텍스트에서 키워드 추출
   */
  private extractFromText(text: string): string[] {
    // 특수문자 제거 및 공백으로 분리
    const words = text
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    // 명사 추출 (간단한 규칙 기반)
    const keywords = words.filter(word => {
      // 불용어 제외
      if (this.stopWords.has(word.toLowerCase())) return false;
      
      // 한글: 2글자 이상
      if (/[가-힣]/.test(word) && word.length >= 2) return true;
      
      // 영문: 3글자 이상
      if (/[a-zA-Z]/.test(word) && word.length >= 3) return true;
      
      return false;
    });
    
    return this.normalizeKeywords(keywords);
  }
  
  /**
   * 키워드 정규화
   */
  private normalizeKeywords(keywords: string[]): string[] {
    return keywords
      .map(keyword => keyword.trim().toLowerCase())
      .filter(keyword => keyword.length > 0);
  }
  
  /**
   * 키워드 맵에 추가
   */
  private addKeywords(
    map: Map<string, YouTubeKeyword>,
    keywords: string[],
    source: 'title' | 'tags' | 'description',
    videoId: string
  ): void {
    keywords.forEach(keyword => {
      if (map.has(keyword)) {
        const existing = map.get(keyword)!;
        existing.frequency += 1;
        if (!existing.videos.includes(videoId)) {
          existing.videos.push(videoId);
        }
      } else {
        map.set(keyword, {
          keyword,
          frequency: 1,
          source,
          videos: [videoId],
        });
      }
    });
  }
  
  /**
   * 복합 키워드 생성 (2-gram)
   */
  extractCompoundKeywords(text: string): string[] {
    const words = this.extractFromText(text);
    const compounds: string[] = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const compound = `${words[i]} ${words[i + 1]}`;
      compounds.push(compound);
    }
    
    return compounds;
  }
}

// 싱글톤 인스턴스
export const keywordExtractor = new KeywordExtractor();
```

### Step 4: 데이터 변환 및 저장 (45분)

#### 4.1 YouTube 데이터 변환기
```typescript
// lib/utils/youtubeDataTransform.ts
import type { YouTubeKeyword } from '@/lib/types/youtube';
import type { KeywordData } from '@/lib/types/common';

export function transformYouTubeKeywords(
  keywords: YouTubeKeyword[]
): KeywordData[] {
  return keywords
    .filter(kw => kw.frequency >= 2) // 최소 2번 이상 등장한 키워드만
    .slice(0, 100) // 상위 100개만
    .map((keyword, index) => {
      // 빈도수 기반 점수 계산
      const score = calculateYouTubeScore(keyword.frequency, index);
      
      // 빈도수 기반 경쟁도 추정
      const competitionLevel = estimateYouTubeCompetition(keyword.frequency);
      
      return {
        keyword: keyword.keyword,
        search_volume: keyword.frequency * 1000, // 추정치
        competition_level: competitionLevel,
        cpc: 0, // YouTube는 CPC 정보 없음
        score,
        platform: 'youtube',
        metadata: {
          frequency: keyword.frequency,
          video_count: keyword.videos.length,
          primary_source: keyword.source,
        }
      };
    });
}

function calculateYouTubeScore(frequency: number, rank: number): number {
  // 빈도 점수 (최대 60점)
  let frequencyScore = 0;
  if (frequency >= 20) frequencyScore = 60;
  else if (frequency >= 15) frequencyScore = 50;
  else if (frequency >= 10) frequencyScore = 40;
  else if (frequency >= 5) frequencyScore = 30;
  else frequencyScore = 20;
  
  // 순위 점수 (최대 40점)
  const rankScore = Math.max(40 - (rank * 2), 0);
  
  return frequencyScore + rankScore;
}

function estimateYouTubeCompetition(frequency: number): string {
  if (frequency >= 15) return '높음';
  if (frequency >= 5) return '중간';
  return '낮음';
}
```

### Step 5: API Route 구현 (1시간)

#### 5.1 YouTube API Route
```typescript
// app/api/youtube/trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { youtubeApiService } from '@/lib/services/youtubeApi';
import { keywordExtractor } from '@/lib/services/keywordExtractor';
import { transformYouTubeKeywords } from '@/lib/utils/youtubeDataTransform';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category') || undefined;
    const useCache = searchParams.get('cache') !== 'false';
    
    // 캐시 확인 (2시간 이내)
    if (useCache) {
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      
      const { data: cachedData } = await supabase
        .from('keywords')
        .select('*')
        .eq('platform', 'youtube')
        .gte('created_at', twoHoursAgo.toISOString())
        .order('score', { ascending: false })
        .limit(50);
      
      if (cachedData && cachedData.length > 0) {
        console.log('캐시된 YouTube 데이터 반환');
        return NextResponse.json({
          success: true,
          source: 'cache',
          data: cachedData
        });
      }
    }
    
    // 새로운 데이터 수집
    console.log('YouTube 트렌드 데이터 수집 중...');
    const videos = await youtubeApiService.getTrendingVideos(50, categoryId);
    
    if (videos.length === 0) {
      return NextResponse.json({
        success: true,
        message: '수집된 동영상이 없습니다.',
        data: []
      });
    }
    
    // 키워드 추출
    const extractedKeywords = keywordExtractor.extractKeywords(videos);
    const transformedData = transformYouTubeKeywords(extractedKeywords);
    
    // 데이터베이스 저장
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
      video_count: videos.length,
      keyword_count: transformedData.length,
      data: transformedData.slice(0, 50) // 상위 50개만 반환
    });
    
  } catch (error) {
    console.error('YouTube API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// 특정 키워드로 동영상 검색
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, maxResults = 25 } = body;
    
    if (!keyword) {
      return NextResponse.json(
        { success: false, error: '검색 키워드가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 동영상 검색
    const videos = await youtubeApiService.searchVideos(keyword, maxResults);
    
    // 키워드 추출
    const extractedKeywords = keywordExtractor.extractKeywords(videos);
    const relatedKeywords = extractedKeywords
      .filter(kw => kw.keyword !== keyword.toLowerCase())
      .slice(0, 20);
    
    return NextResponse.json({
      success: true,
      data: {
        video_count: videos.length,
        keywords: relatedKeywords.map(kw => ({
          keyword: kw.keyword,
          frequency: kw.frequency,
          video_count: kw.videos.length
        }))
      }
    });
    
  } catch (error) {
    console.error('YouTube 검색 오류:', error);
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

### Step 6: 테스트 스크립트 (30분)

#### 6.1 YouTube API 테스트
```typescript
// scripts/testYouTube.ts
import { youtubeApiService } from '../lib/services/youtubeApi';
import { keywordExtractor } from '../lib/services/keywordExtractor';

async function testYouTubeApi() {
  console.log('=== YouTube API 테스트 시작 ===\n');
  
  try {
    // 1. 인기 동영상 수집
    console.log('1. 인기 동영상 수집 테스트');
    const trendingVideos = await youtubeApiService.getTrendingVideos(10);
    console.log(`- 수집된 동영상: ${trendingVideos.length}개`);
    
    if (trendingVideos.length > 0) {
      console.log('- 상위 3개 동영상:');
      trendingVideos.slice(0, 3).forEach((video, i) => {
        console.log(`  ${i + 1}. ${video.title}`);
        console.log(`     조회수: ${video.viewCount.toLocaleString()}`);
        console.log(`     태그: ${video.tags.slice(0, 5).join(', ')}`);
      });
    }
    
    // 2. 키워드 추출
    console.log('\n2. 키워드 추출 테스트');
    const keywords = keywordExtractor.extractKeywords(trendingVideos);
    console.log(`- 추출된 키워드: ${keywords.length}개`);
    console.log('- 상위 10개 키워드:');
    keywords.slice(0, 10).forEach((kw, i) => {
      console.log(`  ${i + 1}. ${kw.keyword} (빈도: ${kw.frequency}, 동영상: ${kw.videos.length}개)`);
    });
    
    // 3. 특정 카테고리 테스트
    console.log('\n3. 카테고리별 동영상 테스트');
    const gamingVideos = await youtubeApiService.getTrendingVideos(5, '20'); // 게임 카테고리
    console.log(`- 게임 카테고리 동영상: ${gamingVideos.length}개`);
    
    // 4. 동영상 검색 테스트
    console.log('\n4. 동영상 검색 테스트');
    const searchResults = await youtubeApiService.searchVideos('웹 개발', 5);
    console.log(`- "웹 개발" 검색 결과: ${searchResults.length}개`);
    
    console.log('\n=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

// 테스트 실행
testYouTubeApi();
```

#### 6.2 실행 명령어
```bash
# 테스트 스크립트 실행
pnpm tsx scripts/testYouTube.ts

# API Route 테스트
# 전체 트렌드
curl http://localhost:3000/api/youtube/trends

# 특정 카테고리
curl http://localhost:3000/api/youtube/trends?category=20

# 캐시 무시
curl http://localhost:3000/api/youtube/trends?cache=false

# 키워드 검색
curl -X POST http://localhost:3000/api/youtube/trends \
  -H "Content-Type: application/json" \
  -d '{"keyword": "Next.js", "maxResults": 10}'
```

## 🔍 트러블슈팅

### 1. API 할당량 초과
```typescript
// 할당량 확인 및 관리
class QuotaManager {
  private static instance: QuotaManager;
  private dailyQuota = 10000; // YouTube API 일일 할당량
  private usedQuota = 0;
  
  static getInstance(): QuotaManager {
    if (!this.instance) {
      this.instance = new QuotaManager();
    }
    return this.instance;
  }
  
  canMakeRequest(cost: number): boolean {
    return this.usedQuota + cost <= this.dailyQuota;
  }
  
  recordUsage(cost: number): void {
    this.usedQuota += cost;
    console.log(`API 할당량 사용: ${this.usedQuota}/${this.dailyQuota}`);
  }
}

// 사용 예시
const quotaManager = QuotaManager.getInstance();
if (quotaManager.canMakeRequest(100)) { // list 요청은 100 포인트
  // API 호출
  quotaManager.recordUsage(100);
}
```

### 2. 키워드 추출 정확도 개선
```typescript
// 한글 형태소 분석기 사용 (선택사항)
import { disassemble, assemble } from 'hangul-js';

function isNoun(word: string): boolean {
  // 명사 판별 규칙 (간단한 예시)
  const nounEndings = ['님', '씨', '장', '관', '사', '가', '자'];
  return nounEndings.some(ending => word.endsWith(ending));
}
```

### 3. 에러 처리
```typescript
// YouTube API 에러 처리
try {
  const response = await youtube.videos.list(params);
} catch (error: any) {
  if (error.code === 403) {
    console.error('API 할당량 초과 또는 권한 오류');
  } else if (error.code === 404) {
    console.error('리소스를 찾을 수 없음');
  } else {
    console.error('알 수 없는 오류:', error.message);
  }
}
```

## ✅ Day 5 체크리스트

### 완료 항목
- [ ] Google Cloud Console 설정
- [ ] YouTube API 키 발급
- [ ] 패키지 설치
- [ ] 타입 정의
- [ ] YouTube API 서비스 구현
- [ ] 키워드 추출기 구현
- [ ] 데이터 변환 로직
- [ ] API Route 구현
- [ ] 테스트 스크립트 작성

### 테스트 항목
- [ ] 인기 동영상 수집 성공
- [ ] 키워드 추출 동작 확인
- [ ] 카테고리별 수집 테스트
- [ ] 검색 기능 테스트
- [ ] 데이터베이스 저장 확인
- [ ] 캐싱 동작 확인

## 📝 다음 단계 (Day 6)
- UI 컴포넌트 구현
- 대시보드 페이지 제작
- 데이터 시각화
- 사용자 인터랙션 추가
