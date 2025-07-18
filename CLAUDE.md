# 블로그 키워드 자동 수집 시스템 - Claude Code 개발 가이드

## 🤖 Core Rules - AI 작업 모드

### 작업 모드
AI는 두 가지 모드로 작동합니다:

1. **Plan mode** - 계획 수립 모드
   - 변경 사항을 실제로 적용하지 않고 계획만 수립
   - 필요한 모든 정보를 수집하여 작업 계획 작성
   - 각 응답 시작 시 `# Mode: PLAN` 표시

2. **Act mode** - 실행 모드
   - 수립된 계획에 따라 실제 코드베이스 변경
   - 사용자가 명시적으로 `ACT` 입력 시에만 전환
   - 각 응답 시작 시 `# Mode: ACT` 표시

### 모드 전환 규칙
- 기본적으로 Plan mode에서 시작
- Act mode는 사용자가 계획을 승인하고 `ACT`를 입력할 때만 전환
- 각 응답 후 자동으로 Plan mode로 복귀
- 사용자가 `PLAN`을 입력하면 언제든 Plan mode로 전환

### 작업 원칙
- Plan mode에서는 변경하지 않고 전체 계획만 제시
- Plan mode에서 작업 요청 시 먼저 계획 승인이 필요함을 안내
- 모든 응답에서 현재 모드를 명확히 표시

## 🎯 프로젝트 개요
개인 블로그 운영을 위한 키워드 자동 수집 시스템을 개발합니다. Google, 네이버, YouTube의 실시간 트렌드를 수집하고 네이버 자동완성을 활용해 롱테일 키워드를 확장하는 MVP를 1주일 내 구축합니다.

## 📁 프로젝트 구조
```
blog-keyword/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes
│   │   ├── collect/       # 데이터 수집 API
│   │   ├── naver/         # 네이버 API
│   │   ├── google/        # Google Trends API
│   │   └── youtube/       # YouTube API
│   ├── dashboard/         # 대시보드 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 재사용 컴포넌트
├── lib/                   # 유틸리티 & 서비스
│   ├── services/          # API 서비스 클래스
│   ├── supabase.ts        # Supabase 클라이언트
│   └── types.ts           # TypeScript 타입 정의
├── docs/                  # 개발 문서
└── .env.local             # 환경 변수
```

## 🛠 기술 스택
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **APIs**: 네이버 검색광고/자동완성, Google Trends, YouTube Data API v3
- **Deployment**: Vercel

## 📅 개발 일정 (7일)

### Day 1: 프로젝트 초기 설정 ✅
**목표**: Next.js 프로젝트 생성 및 Supabase 연동
**상세 가이드**: [DAY1_SETUP_GUIDE.md](./docs/DAY1_SETUP_GUIDE.md)

**작업 내용**:
1. Next.js 프로젝트 생성
   ```bash
   pnpm create next-app@latest blog-keyword --typescript --tailwind --app
   ```

2. 필수 패키지 설치
   ```bash
   pnpm add @supabase/supabase-js axios crypto-js serpapi
   pnpm add -D @types/node
   ```

3. Supabase 데이터베이스 스키마 생성
   ```sql
   -- keywords 테이블
   CREATE TABLE keywords (
       id SERIAL PRIMARY KEY,
       keyword VARCHAR(100) UNIQUE NOT NULL,
       search_volume INTEGER,
       competition_level VARCHAR(20),
       cpc INTEGER,
       score INTEGER,
       platform VARCHAR(20),
       created_at TIMESTAMP DEFAULT NOW()
   );

   -- longtail_keywords 테이블
   CREATE TABLE longtail_keywords (
       id SERIAL PRIMARY KEY,
       parent_keyword VARCHAR(100),
       longtail_keyword VARCHAR(200) UNIQUE,
       source VARCHAR(50),
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. 환경 변수 설정 (.env.local)
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

### Day 2: 네이버 검색광고 API 연동
**목표**: 네이버 검색광고 API로 키워드 검색량, 경쟁도, CPC 조회
**상세 가이드**: [DAY2_NAVER_API_GUIDE.md](./docs/DAY2_NAVER_API_GUIDE.md)

**주요 파일**:
- `lib/services/naverApi.ts` - API 서비스 클래스
- `app/api/naver/keywords/route.ts` - API Route

**구현 기능**:
- HMAC-SHA256 서명 생성
- 키워드 검색량 조회
- 연관 키워드 수집
- 에러 핸들링 및 재시도 로직

### Day 3: 네이버 자동완성 구현
**목표**: 네이버 자동완성 API로 실시간 트렌드 롱테일 키워드 생성
**상세 가이드**: [DAY3_AUTOCOMPLETE_GUIDE.md](./docs/DAY3_AUTOCOMPLETE_GUIDE.md)

**주요 파일**:
- `lib/services/naverAutoComplete.ts` - 자동완성 서비스
- `lib/services/longtailGenerator.ts` - 롱테일 생성기

**구현 기능**:
- 자동완성 API 호출 (최대 10개)
- 연관 검색어 수집
- 검색광고 API 폴백
- Rate limiting 대응

### Day 4: Google Trends 연동 (SerpAPI 활용)
**목표**: SerpAPI를 활용한 Google Trends 일일/실시간 트렌드 수집
**상세 가이드**: [DAY4_GOOGLE_TRENDS_GUIDE.md](./docs/DAY4_GOOGLE_TRENDS_GUIDE.md)

**주요 파일**:
- `lib/services/googleTrends.ts` - Google Trends 서비스
- `app/api/google/trends/route.ts` - API Route

**구현 기능**:
- SerpAPI 패키지 활용 (월 100회 무료)
- 일일/실시간 트렌드 수집 (한국)
- 키워드 관심도 및 연관 검색어 조회
- 데이터 파싱 및 정규화

### Day 5: YouTube API 연동
**목표**: YouTube 인기 급상승 동영상에서 키워드 추출
**상세 가이드**: [DAY5_YOUTUBE_API_GUIDE.md](./docs/DAY5_YOUTUBE_API_GUIDE.md)

**주요 파일**:
- `lib/services/youtubeApi.ts` - YouTube 서비스
- `app/api/youtube/trends/route.ts` - API Route

**구현 기능**:
- YouTube Data API v3 연동
- 인기 동영상 50개 수집
- 제목/태그에서 키워드 추출

### Day 6: UI 구현
**목표**: 반응형 대시보드 UI 개발
**상세 가이드**: [DAY6_UI_IMPLEMENTATION_GUIDE.md](./docs/DAY6_UI_IMPLEMENTATION_GUIDE.md)

**주요 파일**:
- `app/dashboard/page.tsx` - 대시보드 페이지
- `components/KeywordCard.tsx` - 키워드 카드
- `components/CompetitionBadge.tsx` - 경쟁도 뱃지

**구현 기능**:
- 키워드 목록 표시
- 경쟁도별 색상 표시 (🟢낮음/🟡중간/🔴높음)
- 수동 새로고침 버튼
- CSV 다운로드

### Day 7: 통합 테스트 및 배포
**목표**: 전체 기능 통합 및 Vercel 배포
**상세 가이드**: [DAY7_BASIC_UI_IMPLEMENTATION.md](./docs/DAY7_BASIC_UI_IMPLEMENTATION.md)

**주요 파일**:
- `app/api/collect/all/route.ts` - 통합 수집 API
- `vercel.json` - 배포 설정

**구현 기능**:
- 모든 플랫폼 데이터 통합 수집
- 중복 제거 및 점수 계산
- Vercel 배포
- 기본 문서화

## 💡 개발 시 주의사항

### API 제한 대응
1. **네이버 자동완성**: Rate limiting 있음, 실패 시 검색광고 API 폴백
2. **YouTube API**: 일일 10,000 할당량, 배치 요청으로 최적화
3. **SerpAPI Google Trends**: 월 100회 무료, 초과 시 캐싱 데이터 활용

### 에러 핸들링
```typescript
// 모든 API 호출에 재시도 로직 구현
async function apiCallWithRetry(fn: Function, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 데이터베이스 최적화
- UPSERT 사용으로 중복 방지
- 인덱스 설정으로 조회 성능 향상
- 배치 insert로 성능 최적화

## 🚀 빠른 시작 명령어

### 개발 서버 실행
```bash
pnpm dev
```

### 데이터 수집 테스트
```bash
# 네이버 키워드 수집
curl -X POST http://localhost:3000/api/naver/keywords \
  -H "Content-Type: application/json" \
  -d '{"keyword": "블로그"}'

# 전체 수집
curl -X POST http://localhost:3000/api/collect/all
```

### 빌드 및 배포
```bash
pnpm build
vercel --prod
```

## 📊 주요 기능 구현 상태

| 기능 | 파일 경로 | 상태 | 우선순위 |
|------|-----------|------|----------|
| Supabase 연동 | `lib/supabase.ts` | ⏳ | P0 |
| 네이버 검색광고 API | `lib/services/naverApi.ts` | ⏳ | P0 |
| 네이버 자동완성 | `lib/services/naverAutoComplete.ts` | ⏳ | P0 |
| Google Trends | `lib/services/googleTrends.ts` | ⏳ | P1 |
| YouTube API | `lib/services/youtubeApi.ts` | ⏳ | P1 |
| 대시보드 UI | `app/dashboard/page.tsx` | ⏳ | P0 |
| 통합 수집 API | `app/api/collect/all/route.ts` | ⏳ | P0 |

## 🔑 환경 변수 체크리스트

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase 익명 키

# 네이버 API
NAVER_API_KEY=                   # 검색광고 API 키
NAVER_SECRET_KEY=                # 검색광고 시크릿 키
NAVER_CUSTOMER_ID=               # 검색광고 고객 ID

# SerpAPI (Google Trends)
SERPAPI_KEY=                     # SerpAPI 키 (월 100회 무료)

# YouTube API
YOUTUBE_API_KEY=                 # YouTube Data API v3 키
```

## 📝 코드 스타일 가이드

### TypeScript 타입 정의
```typescript
// lib/types.ts
export interface Keyword {
  id?: number;
  keyword: string;
  searchVolume: number;
  competitionLevel: '낮음' | '중간' | '높음';
  cpc: number;
  score: number;
  platform: 'naver' | 'google' | 'youtube';
  createdAt?: string;
}

export interface LongtailKeyword {
  id?: number;
  parentKeyword: string;
  longtailKeyword: string;
  source: 'autocomplete' | 'related' | 'pattern';
  createdAt?: string;
}
```

### API 응답 형식
```typescript
// 성공 응답
{
  success: true,
  data: any,
  message?: string
}

// 에러 응답
{
  success: false,
  error: string,
  code?: string
}
```

### 컴포넌트 구조
```typescript
// Functional Component with TypeScript
interface Props {
  keyword: Keyword;
  onRefresh?: () => void;
}

export default function KeywordCard({ keyword, onRefresh }: Props) {
  // 구현
}
```

## 🐛 트러블슈팅 가이드

### 네이버 API 인증 실패
- API 키와 시크릿 키 확인
- Customer ID 확인
- 타임스탬프 동기화 확인

### SerpAPI 인증 실패
- SERPAPI_KEY 환경 변수 설정 확인
- API 키 유효성 확인
- 월 사용량 초과 여부 확인

### 자동완성 API 차단
- User-Agent 헤더 설정 확인
- Referer 헤더 추가
- Rate limiting 확인 (요청 간격 조절)

### SerpAPI 에러 처리
- HTTP 429: 사용량 초과 시 캐싱 데이터 활용
- HTTP 401: API 키 확인 필요
- HTTP 403: 계정 권한 문제 또는 계정 삭제
- 대시보드에서 사용량 모니터링

### Supabase 연결 오류
- 환경 변수 설정 확인
- 네트워크 연결 확인
- RLS (Row Level Security) 정책 확인

## ✅ 개발 완료 체크리스트

### 필수 기능 (MVP)
- [ ] Next.js 프로젝트 설정
- [ ] Supabase 데이터베이스 연동
- [ ] 네이버 검색광고 API 연동
- [ ] 네이버 자동완성 구현
- [ ] 기본 대시보드 UI
- [ ] 데이터 수집 API 통합

### 추가 기능
- [ ] Google Trends 연동 (SerpAPI)
- [ ] YouTube API 연동
- [ ] CSV 다운로드
- [ ] 필터링 기능

### 배포
- [ ] 환경 변수 설정 (SERPAPI_KEY 포함)
- [ ] Vercel 배포
- [ ] 도메인 연결
- [ ] 모니터링 설정
- [ ] SerpAPI 사용량 모니터링
---

이 가이드를 참고하여 Claude Code에서 단계별로 개발을 진행하세요. 각 Day별 작업을 완료하면서 체크리스트를 업데이트하고, 문제 발생 시 트러블슈팅 가이드를 참조하세요.