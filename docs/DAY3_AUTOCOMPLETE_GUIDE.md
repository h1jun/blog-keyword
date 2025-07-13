# Day 3: 네이버 자동완성 구현 가이드

## 🎯 오늘의 목표
네이버 자동완성 API를 활용하여 롱테일 키워드를 자동으로 생성하는 기능을 구현합니다.

---

## 📋 작업 체크리스트

### 1. 자동완성 API 분석 (30분)

네이버 자동완성 API는 공식 API가 아니므로 주의가 필요합니다:
- 엔드포인트: `https://ac.search.naver.com/nx/ac`
- Rate limiting 존재
- User-Agent 헤더 필수

### 2. 자동완성 타입 정의 (15분)

`types/autocomplete.ts` 파일 생성:

```typescript
export interface AutoCompleteResponse {
  query: string
  items: [string[], string[][]]
  // items[0]: 자동완성 키워드 배열
  // items[1]: 연관 검색어 배열 (있는 경우)
}

export interface LongtailKeyword {
  keyword: string
  type: 'autocomplete' | 'related' | 'pattern'
  order?: number
}

export interface AutoCompleteResult {
  success: boolean
  keywords: LongtailKeyword[]
  source: 'api' | 'fallback'
}
```

### 3. 자동완성 매니저 구현 (60분)

`lib/services/autoCompleteManager.ts` 파일 생성:

```typescript
import { LongtailKeyword, AutoCompleteResult } from '@/types/autocomplete'

export class AutoCompleteManager {
  private failureCount: number = 0
  private lastFailureTime: number | null = null
  private readonly backoffTime: number = 1000 // 1초
  private readonly maxFailures: number = 3

  /**
   * 자동완성 API 호출 가능 여부 확인
   */
  private canCallApi(): boolean {
    if (this.failureCount < this.maxFailures) {
      return true
    }

    if (!this.lastFailureTime) {
      return true
    }

    const timeSinceFailure = Date.now() - this.lastFailureTime
    const requiredWaitTime = this.backoffTime * this.failureCount

    return timeSinceFailure >= requiredWaitTime
  }

  /**
   * 실패 카운터 리셋
   */
  private resetFailureCount(): void {
    this.failureCount = 0
    this.lastFailureTime = null
  }

  /**
   * 실패 기록
   */
  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
  }

  /**
   * 네이버 자동완성 API 호출
   */
  async getAutoComplete(keyword: string): Promise<AutoCompleteResult> {
    // API 호출 가능 여부 확인
    if (!this.canCallApi()) {
      console.log('자동완성 API 일시 중단, 폴백 모드 사용')
      return this.getFallbackKeywords(keyword)
    }

    try {
      // 랜덤 딜레이 추가 (100-300ms)
      await this.randomDelay()

      const url = this.buildAutoCompleteUrl(keyword)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://search.naver.com',
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // 성공 시 실패 카운터 리셋
      this.resetFailureCount()
      
      return this.parseAutoCompleteResponse(data)
    } catch (error) {
      console.error('자동완성 API 호출 실패:', error)
      this.recordFailure()
      
      // 폴백 모드로 전환
      return this.getFallbackKeywords(keyword)
    }
  }

  /**
   * 자동완성 URL 생성
   */
  private buildAutoCompleteUrl(keyword: string): string {
    const params = new URLSearchParams({
      q: keyword,
      con: '0',
      frm: 'nv',
      ans: '2',
      r_format: 'json',
      r_enc: 'UTF-8',
      st: '100',
      q_enc: 'UTF-8',
    })

    return `https://ac.search.naver.com/nx/ac?${params.toString()}`
  }

  /**
   * 자동완성 응답 파싱
   */
  private parseAutoCompleteResponse(data: any): AutoCompleteResult {
    const keywords: LongtailKeyword[] = []

    // 자동완성 키워드 처리
    if (data.items && data.items[0]) {
      data.items[0].forEach((item: string[], index: number) => {
        keywords.push({
          keyword: item[0],
          type: 'autocomplete',
          order: index + 1,
        })
      })
    }

    // 연관 검색어 처리
    if (data.items && data.items[1]) {
      data.items[1].forEach((item: string[], index: number) => {
        keywords.push({
          keyword: item[0],
          type: 'related',
          order: index + 1,
        })
      })
    }

    return {
      success: true,
      keywords,
      source: 'api',
    }
  }

  /**
   * 폴백 키워드 생성
   */
  private getFallbackKeywords(keyword: string): AutoCompleteResult {
    const patterns = ['추천', '후기', '가격', '비교', '순위', '종류', '방법']
    
    const keywords: LongtailKeyword[] = patterns
      .slice(0, 3) // 기본 3개만 사용
      .map((pattern, index) => ({
        keyword: `${keyword} ${pattern}`,
        type: 'pattern' as const,
        order: index + 1,
      }))

    return {
      success: true,
      keywords,
      source: 'fallback',
    }
  }

  /**
   * 랜덤 딜레이
   */
  private async randomDelay(): Promise<void> {
    const delay = 100 + Math.random() * 200 // 100-300ms
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// 싱글톤 인스턴스
export const autoCompleteManager = new AutoCompleteManager()
```

### 4. 롱테일 키워드 생성기 구현 (45분)

`lib/services/longtailGenerator.ts` 파일 생성:

```typescript
import { autoCompleteManager } from './autoCompleteManager'
import { naverApi } from './naverApi'
import { LongtailKeyword } from '@/types/autocomplete'

export interface LongtailResult {
  parentKeyword: string
  longtails: Array<{
    keyword: string
    type: 'autocomplete' | 'related' | 'pattern'
    searchVolume?: number
    competition?: string
    score?: number
  }>
  totalCount: number
  source: 'api' | 'fallback'
}

export class LongtailGenerator {
  /**
   * 롱테일 키워드 생성 (간단 버전)
   */
  async generateSimple(seedKeyword: string): Promise<LongtailResult> {
    // 1. 자동완성 데이터 수집
    const autoCompleteResult = await autoCompleteManager.getAutoComplete(seedKeyword)
    
    // 2. 중복 제거 및 정리
    const uniqueKeywords = this.removeDuplicates(autoCompleteResult.keywords)
    
    // 3. 최대 20개로 제한
    const limitedKeywords = uniqueKeywords.slice(0, 20)
    
    return {
      parentKeyword: seedKeyword,
      longtails: limitedKeywords.map(kw => ({
        keyword: kw.keyword,
        type: kw.type,
      })),
      totalCount: limitedKeywords.length,
      source: autoCompleteResult.source,
    }
  }

  /**
   * 롱테일 키워드 생성 (검색량 포함)
   */
  async generateWithVolume(seedKeyword: string): Promise<LongtailResult> {
    // 1. 기본 롱테일 생성
    const basicResult = await this.generateSimple(seedKeyword)
    
    // 2. 검색량 조회 (선택적)
    const enrichedLongtails = await this.enrichWithSearchVolume(
      basicResult.longtails.slice(0, 10) // 상위 10개만 검색량 조회
    )
    
    return {
      ...basicResult,
      longtails: [
        ...enrichedLongtails,
        ...basicResult.longtails.slice(10),
      ],
    }
  }

  /**
   * 검색량 정보 추가
   */
  private async enrichWithSearchVolume(
    keywords: Array<{ keyword: string; type: string }>
  ) {
    const enrichedKeywords = []
    
    for (const kw of keywords) {
      try {
        const keywordData = await naverApi.getKeywordData(kw.keyword)
        
        if (keywordData) {
          enrichedKeywords.push({
            ...kw,
            searchVolume: naverApi.calculateTotalVolume(keywordData),
            competition: keywordData.compIdx,
            score: naverApi.calculateCompetitionScore(keywordData),
          })
        } else {
          enrichedKeywords.push(kw)
        }
      } catch (error) {
        console.error(`검색량 조회 실패: ${kw.keyword}`)
        enrichedKeywords.push(kw)
      }
      
      // Rate limiting을 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    return enrichedKeywords
  }

  /**
   * 중복 제거
   */
  private removeDuplicates(keywords: LongtailKeyword[]): LongtailKeyword[] {
    const seen = new Set<string>()
    return keywords.filter(kw => {
      const normalized = kw.keyword.trim().toLowerCase()
      if (seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })
  }
}

// 싱글톤 인스턴스
export const longtailGenerator = new LongtailGenerator()
```

### 5. API Route 구현 (30분)

`app/api/longtail/generate/route.ts` 파일 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { longtailGenerator } from '@/lib/services/longtailGenerator'
import { z } from 'zod'

const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
  includeVolume: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, includeVolume } = requestSchema.parse(body)
    
    // 롱테일 키워드 생성
    const result = includeVolume
      ? await longtailGenerator.generateWithVolume(keyword)
      : await longtailGenerator.generateSimple(keyword)
    
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('롱테일 생성 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

### 6. 테스트 페이지 구현 (40분)

`app/test-longtail/page.tsx` 파일 생성:

```typescript
'use client'

import { useState } from 'react'

interface LongtailData {
  keyword: string
  type: string
  searchVolume?: number
  competition?: string
  score?: number
}

export default function TestLongtail() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [longtails, setLongtails] = useState<LongtailData[]>([])
  const [includeVolume, setIncludeVolume] = useState(false)
  const [source, setSource] = useState<string>('')

  const generateLongtails = async () => {
    if (!keyword.trim()) return

    setLoading(true)
    setLongtails([])

    try {
      const response = await fetch('/api/longtail/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          includeVolume,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setLongtails(data.data.longtails)
        setSource(data.data.source)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'autocomplete':
        return 'bg-blue-100 text-blue-800'
      case 'related':
        return 'bg-green-100 text-green-800'
      case 'pattern':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">롱테일 키워드 생성 테스트</h1>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateLongtails()}
            placeholder="시드 키워드를 입력하세요"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={generateLongtails}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '생성 중...' : '생성'}
          </button>
        </div>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeVolume}
            onChange={(e) => setIncludeVolume(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">검색량 데이터 포함 (느림)</span>
        </label>
      </div>

      {source && (
        <div className="mb-4 text-sm text-gray-600">
          데이터 소스: {source === 'api' ? '네이버 자동완성' : '폴백 패턴'}
        </div>
      )}

      {longtails.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-3">
            생성된 롱테일 키워드 ({longtails.length}개)
          </h2>
          {longtails.map((lt, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">
                  #{index + 1}
                </span>
                <span className="font-medium">{lt.keyword}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getTypeColor(
                    lt.type
                  )}`}
                >
                  {lt.type}
                </span>
              </div>
              
              {includeVolume && lt.searchVolume !== undefined && (
                <div className="flex items-center gap-4 text-sm">
                  <span>검색량: {lt.searchVolume.toLocaleString()}</span>
                  {lt.competition && (
                    <span>경쟁도: {lt.competition}</span>
                  )}
                  {lt.score !== undefined && (
                    <span>점수: {lt.score}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 7. 데이터베이스 저장 기능 추가 (30분)

`app/api/longtail/save/route.ts` 파일 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const requestSchema = z.object({
  parentKeyword: z.string(),
  longtails: z.array(z.object({
    keyword: z.string(),
    type: z.enum(['autocomplete', 'related', 'pattern']),
  })),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { parentKeyword, longtails } = requestSchema.parse(body)
    
    // 데이터 변환
    const dataToInsert = longtails.map(lt => ({
      parent_keyword: parentKeyword,
      longtail_keyword: lt.keyword,
      source: lt.type,
    }))
    
    // 일괄 저장
    const { data, error } = await supabase
      .from('longtail_keywords')
      .upsert(dataToInsert, {
        onConflict: 'longtail_keyword',
        ignoreDuplicates: true,
      })
      .select()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data: {
        saved: data?.length || 0,
        total: longtails.length,
      },
    })
  } catch (error) {
    console.error('저장 오류:', error)
    
    return NextResponse.json(
      { success: false, error: '저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

### 8. 통합 테스트 스크립트 (20분)

`scripts/test-autocomplete.js` 파일 생성:

```javascript
// 자동완성 기능 테스트 스크립트
const testKeywords = [
  '블로그',
  '캠핑',
  '챗GPT',
  '부동산',
  'React',
]

async function testAutoComplete() {
  console.log('🧪 자동완성 테스트 시작...\n')
  
  for (const keyword of testKeywords) {
    console.log(`\n📌 테스트 키워드: "${keyword}"`)
    
    try {
      const response = await fetch('http://localhost:3000/api/longtail/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          includeVolume: false,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ 성공: ${data.data.totalCount}개 생성`)
        console.log(`   소스: ${data.data.source}`)
        console.log(`   샘플:`, data.data.longtails.slice(0, 3).map(lt => lt.keyword))
      } else {
        console.log(`❌ 실패:`, data.error)
      }
    } catch (error) {
      console.log(`❌ 오류:`, error.message)
    }
    
    // Rate limiting 방지
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n✨ 테스트 완료!')
}

// 실행
testAutoComplete()
```

### 9. CORS 및 보안 설정 (15분)

`middleware.ts` 파일 생성:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // API Routes에만 적용
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // CORS 헤더 설정
    const response = NextResponse.next()
    
    // 개발 환경에서만 허용
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    }
    
    return response
  }
}

export const config = {
  matcher: '/api/:path*',
}
```

### 10. Git 커밋 (10분)

```bash
# 변경사항 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "feat: 네이버 자동완성 기능 구현

- AutoCompleteManager 클래스 구현
- LongtailGenerator 서비스 구현
- 폴백 메커니즘 추가
- API Routes 구현
- 테스트 페이지 및 스크립트 추가"
```

---

## 🎉 Day 3 완료!

### 완료 사항
- ✅ 네이버 자동완성 API 연동
- ✅ 폴백 메커니즘 구현
- ✅ 롱테일 키워드 생성기
- ✅ Rate limiting 대응
- ✅ 데이터베이스 저장 기능

### 테스트 시나리오
1. 일반 키워드: "블로그", "캠핑"
2. 트렌드 키워드: "챗GPT", "AI"
3. 롱테일 키워드: "서울 맛집 추천"
4. 특수 키워드: 이모지, 특수문자 포함

### 트러블슈팅
1. **자동완성 API 차단**:
   - 폴백 패턴으로 자동 전환
   - Rate limiting 준수

2. **한글 인코딩 문제**:
   - UTF-8 인코딩 확인
   - encodeURIComponent 사용

3. **빈 결과**:
   - 특수하거나 새로운 키워드는 결과가 없을 수 있음
   - 폴백 패턴이 자동 적용됨

### 성능 최적화 팁
- 검색량 조회는 선택적으로 사용
- 캐싱 적용 고려 (Phase 2)
- 배치 처리로 DB 저장

### 다음 단계
내일은 Google Trends API를 연동하여 글로벌 트렌드 데이터를 수집합니다.