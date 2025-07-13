# Day 2: 네이버 검색광고 API 연동 가이드

## 🎯 오늘의 목표
네이버 검색광고 API를 연동하여 키워드의 검색량, 경쟁도, CPC 데이터를 수집하는 기능을 구현합니다.

---

## 📋 작업 체크리스트

### 1. 네이버 검색광고 계정 설정 (30분)

1. [네이버 검색광고](https://searchad.naver.com) 접속
2. 계정 생성 또는 로그인
3. 관리자 > API 사용 관리 메뉴 이동
4. API 키 발급:
   - API Key
   - Secret Key
   - Customer ID (계정 번호)

### 2. 환경 변수 추가 (10분)

`.env.local` 파일에 추가:

```bash
# Naver Search Ad API
NAVER_API_KEY=your_api_key_here
NAVER_SECRET_KEY=your_secret_key_here
NAVER_CUSTOMER_ID=your_customer_id_here
```

### 3. 필요한 패키지 설치 (10분)

```bash
# HMAC 서명 생성용
pnpm add crypto-js
pnpm add -D @types/crypto-js
```

### 4. 네이버 API 타입 정의 (20분)

`types/naver.ts` 파일 생성:

```typescript
export interface NaverKeywordData {
  relKeyword: string
  monthlyPcQcCnt: number | null
  monthlyMobileQcCnt: number | null
  monthlyAvePcClkCnt: number | null
  monthlyAveMobileClkCnt: number | null
  monthlyAvePcCtr: number | null
  monthlyAveMobileCtr: number | null
  plAvgDepth: number
  compIdx: '낮음' | '중간' | '높음'
  avgCpc?: number
}

export interface NaverApiResponse {
  keywordList: NaverKeywordData[]
}

export interface NaverApiError {
  code: string
  message: string
}
```

### 5. 네이버 API 서비스 구현 (60분)

`lib/services/naverApi.ts` 파일 생성:

```typescript
import CryptoJS from 'crypto-js'
import { NaverKeywordData, NaverApiResponse } from '@/types/naver'

export class NaverApiService {
  private apiKey: string
  private secretKey: string
  private customerId: string
  private baseUrl = 'https://api.naver.com'

  constructor() {
    this.apiKey = process.env.NAVER_API_KEY!
    this.secretKey = process.env.NAVER_SECRET_KEY!
    this.customerId = process.env.NAVER_CUSTOMER_ID!
  }

  /**
   * HMAC-SHA256 서명 생성
   */
  private generateSignature(
    timestamp: string,
    method: string,
    uri: string
  ): string {
    const message = `${timestamp}.${method}.${uri}`
    return CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(message, this.secretKey)
    )
  }

  /**
   * API 요청 헤더 생성
   */
  private getHeaders(method: string, uri: string) {
    const timestamp = Date.now().toString()
    const signature = this.generateSignature(timestamp, method, uri)

    return {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      'X-API-KEY': this.apiKey,
      'X-Customer': this.customerId,
      'X-Signature': signature,
    }
  }

  /**
   * 키워드 데이터 조회
   */
  async getKeywordData(keyword: string): Promise<NaverKeywordData | null> {
    const uri = '/keywordstool'
    const url = `${this.baseUrl}${uri}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders('GET', uri),
        body: JSON.stringify({
          hintKeywords: keyword,
          showDetail: '1'
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data: NaverApiResponse = await response.json()
      
      // 입력한 키워드와 정확히 일치하는 데이터 찾기
      const keywordData = data.keywordList.find(
        item => item.relKeyword === keyword
      )

      return keywordData || null
    } catch (error) {
      console.error('네이버 API 호출 실패:', error)
      return null
    }
  }

  /**
   * 연관 키워드 조회
   */
  async getRelatedKeywords(
    keyword: string,
    limit: number = 10
  ): Promise<NaverKeywordData[]> {
    const uri = '/keywordstool'
    const url = `${this.baseUrl}${uri}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders('GET', uri),
        body: JSON.stringify({
          hintKeywords: keyword,
          showDetail: '1'
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data: NaverApiResponse = await response.json()
      
      // 연관 키워드 필터링 (원본 키워드 제외)
      return data.keywordList
        .filter(item => item.relKeyword !== keyword)
        .slice(0, limit)
    } catch (error) {
      console.error('연관 키워드 조회 실패:', error)
      return []
    }
  }

  /**
   * 검색량 합계 계산
   */
  calculateTotalVolume(data: NaverKeywordData): number {
    const pc = data.monthlyPcQcCnt || 0
    const mobile = data.monthlyMobileQcCnt || 0
    return pc + mobile
  }

  /**
   * 경쟁도 점수 계산
   */
  calculateCompetitionScore(data: NaverKeywordData): number {
    const competition = data.compIdx
    const totalVolume = this.calculateTotalVolume(data)
    
    let baseScore = 0
    switch (competition) {
      case '낮음':
        baseScore = 85
        break
      case '중간':
        baseScore = 55
        break
      case '높음':
        baseScore = 25
        break
    }

    // 검색량에 따른 보정
    if (totalVolume < 100) baseScore -= 10
    else if (totalVolume > 10000) baseScore += 5

    return Math.max(0, Math.min(100, baseScore))
  }
}

// 싱글톤 인스턴스
export const naverApi = new NaverApiService()
```

### 6. API Route 구현 (40분)

`app/api/naver/keyword/route.ts` 파일 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { naverApi } from '@/lib/services/naverApi'
import { z } from 'zod'

// 요청 스키마 검증
const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    
    // 입력 검증
    const { keyword } = requestSchema.parse(body)
    
    // 키워드 데이터 조회
    const keywordData = await naverApi.getKeywordData(keyword)
    
    if (!keywordData) {
      return NextResponse.json(
        { success: false, error: '키워드 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    // 응답 데이터 가공
    const response = {
      keyword: keywordData.relKeyword,
      searchVolume: naverApi.calculateTotalVolume(keywordData),
      pcVolume: keywordData.monthlyPcQcCnt || 0,
      mobileVolume: keywordData.monthlyMobileQcCnt || 0,
      competition: keywordData.compIdx,
      cpc: keywordData.avgCpc || 0,
      score: naverApi.calculateCompetitionScore(keywordData),
    }
    
    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('API 오류:', error)
    
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

### 7. 연관 키워드 API Route (30분)

`app/api/naver/related/route.ts` 파일 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { naverApi } from '@/lib/services/naverApi'
import { z } from 'zod'

const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, limit = 10 } = requestSchema.parse(body)
    
    // 연관 키워드 조회
    const relatedKeywords = await naverApi.getRelatedKeywords(keyword, limit)
    
    // 데이터 가공
    const processedKeywords = relatedKeywords.map(data => ({
      keyword: data.relKeyword,
      searchVolume: naverApi.calculateTotalVolume(data),
      competition: data.compIdx,
      score: naverApi.calculateCompetitionScore(data),
    }))
    
    return NextResponse.json({
      success: true,
      data: processedKeywords,
    })
  } catch (error) {
    console.error('API 오류:', error)
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

### 8. 테스트 페이지 구현 (30분)

`app/test-naver/page.tsx` 파일 생성:

```typescript
'use client'

import { useState } from 'react'

interface KeywordResult {
  keyword: string
  searchVolume: number
  pcVolume: number
  mobileVolume: number
  competition: string
  cpc: number
  score: number
}

export default function TestNaver() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KeywordResult | null>(null)
  const [error, setError] = useState('')

  const searchKeyword = async () => {
    if (!keyword.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/naver/keyword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || '오류가 발생했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">네이버 API 테스트</h1>
      
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchKeyword()}
            placeholder="검색할 키워드를 입력하세요"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchKeyword}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{result.keyword}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">총 검색량</p>
              <p className="text-2xl font-bold">{result.searchVolume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">경쟁도</p>
              <p className="text-2xl font-bold">
                {result.competition === '낮음' && '🟢'} 
                {result.competition === '중간' && '🟡'} 
                {result.competition === '높음' && '🔴'} 
                {result.competition}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PC 검색량</p>
              <p className="text-lg">{result.pcVolume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">모바일 검색량</p>
              <p className="text-lg">{result.mobileVolume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">평균 CPC</p>
              <p className="text-lg">₩{result.cpc.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">점수</p>
              <p className="text-lg">{result.score}점</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 9. 유틸리티 함수 추가 (20분)

`lib/utils/keyword.ts` 파일 생성:

```typescript
import { NaverKeywordData } from '@/types/naver'

/**
 * 키워드 품질 판단
 */
export function getKeywordQuality(
  searchVolume: number,
  competition: string
): 'excellent' | 'good' | 'average' | 'poor' {
  if (searchVolume >= 1000 && competition === '낮음') {
    return 'excellent'
  } else if (searchVolume >= 500 && competition !== '높음') {
    return 'good'
  } else if (searchVolume >= 100) {
    return 'average'
  }
  return 'poor'
}

/**
 * 추천 메시지 생성
 */
export function getRecommendationMessage(
  score: number,
  competition: string
): string {
  if (score >= 80) {
    return '🎯 즉시 작성을 추천합니다!'
  } else if (score >= 60) {
    return '💡 좋은 기회입니다. 콘텐츠 품질에 집중하세요.'
  } else if (score >= 40) {
    return '🤔 신중히 검토해보세요. 롱테일 키워드를 고려하세요.'
  } else {
    return '⚠️ 다른 키워드를 찾아보는 것이 좋겠습니다.'
  }
}

/**
 * 검색량 포맷팅
 */
export function formatSearchVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`
  }
  return volume.toString()
}
```

### 10. 에러 처리 개선 (20분)

`lib/utils/error.ts` 파일 생성:

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): {
  message: string
  statusCode: number
} {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    }
  }

  return {
    message: '알 수 없는 오류가 발생했습니다.',
    statusCode: 500,
  }
}
```

### 11. Git 커밋 (10분)

```bash
# 변경사항 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "feat: 네이버 검색광고 API 연동 완료

- NaverApiService 클래스 구현
- 키워드 검색량 조회 API Route
- 연관 키워드 조회 API Route
- 테스트 페이지 구현
- 유틸리티 함수 추가"
```

---

## 🎉 Day 2 완료!

### 완료 사항
- ✅ 네이버 검색광고 API 인증 구현
- ✅ 키워드 검색량 조회 기능
- ✅ 경쟁도 점수 계산 로직
- ✅ API Routes 구현
- ✅ 테스트 페이지 구현

### 테스트 키워드 추천
- "블로그" - 높은 검색량
- "캠핑 텐트" - 중간 검색량
- "노트북 추천 2024" - 롱테일 키워드

### 트러블슈팅
1. **API 인증 오류**: 
   - API 키와 Secret 키가 올바른지 확인
   - Customer ID가 정확한지 확인

2. **CORS 오류**:
   - API Route를 통해 호출하고 있는지 확인
   - 직접 브라우저에서 네이버 API를 호출하면 CORS 오류 발생

3. **검색 결과 없음**:
   - 매우 특수한 키워드는 데이터가 없을 수 있음
   - 일반적인 키워드로 테스트

### 다음 단계
내일은 네이버 자동완성 API를 구현하여 롱테일 키워드를 자동으로 생성하는 기능을 추가합니다.