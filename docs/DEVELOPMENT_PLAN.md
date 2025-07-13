# 블로그 키워드 자동 수집 시스템 - 개발 계획

## 📅 전체 개발 일정 개요
- **총 개발 기간**: 7일 (1주일)
- **일일 작업 시간**: 4-6시간
- **개발 방법론**: 애자일, 일일 단위 스프린트

---

## 🎯 Day 1: 프로젝트 초기 설정

### 1.1 개발 환경 준비 (1시간)
- [ ] Node.js 18+ 설치 확인
- [ ] pnpm 설치 (`npm install -g pnpm`)
- [ ] VS Code 또는 WebStorm 설정
- [ ] Git 초기화

### 1.2 Next.js 프로젝트 생성 (30분)
```bash
pnpm create next-app@latest keyword-collector --typescript --tailwind --app
cd keyword-collector
```

**설정 옵션**:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: Yes (@/*)

### 1.3 필수 패키지 설치 (30분)
```bash
# Supabase
pnpm add @supabase/supabase-js

# API 관련
pnpm add axios
pnpm add crypto-js

# 개발 도구
pnpm add -D @types/node
```

### 1.4 Supabase 프로젝트 설정 (1시간)
- [ ] Supabase 계정 생성 (https://supabase.com)
- [ ] 새 프로젝트 생성
- [ ] 데이터베이스 스키마 생성
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

### 1.5 환경 변수 설정 (30분)
```bash
# .env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 1.6 Supabase 클라이언트 설정 (30분)
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 1.7 기본 프로젝트 구조 설정 (30분)
```
keyword-collector/
├── app/
│   ├── api/
│   │   └── collect/
│   ├── dashboard/
│   └── layout.tsx
├── lib/
│   ├── supabase.ts
│   └── types.ts
├── components/
└── .env.local
```

### Day 1 완료 체크리스트
- [ ] Next.js 프로젝트 생성 완료
- [ ] Supabase 연동 완료
- [ ] 데이터베이스 테이블 생성 완료
- [ ] 기본 프로젝트 구조 설정 완료

---

## 🎯 Day 2: 네이버 검색광고 API 연동

### 2.1 네이버 API 계정 설정 (1시간)
- [ ] 네이버 검색광고 계정 생성
- [ ] API 키 발급
- [ ] 환경 변수 추가
  ```bash
  NAVER_API_KEY=your_api_key
  NAVER_SECRET_KEY=your_secret_key
  NAVER_CUSTOMER_ID=your_customer_id
  ```

### 2.2 네이버 API 서비스 클래스 구현 (2시간)
```typescript
// lib/services/naverApi.ts
```
- [ ] API 서명 생성 함수
- [ ] 키워드 데이터 조회 함수
- [ ] 에러 핸들링
- [ ] 타입 정의

### 2.3 API Route 구현 (1시간)
```typescript
// app/api/naver/keywords/route.ts
```
- [ ] POST 엔드포인트 구현
- [ ] 요청 검증
- [ ] 응답 포맷팅

### 2.4 테스트 및 디버깅 (1시간)
- [ ] API 연동 테스트
- [ ] 에러 케이스 처리
- [ ] 로깅 추가

### Day 2 완료 체크리스트
- [ ] 네이버 API 인증 구현 완료
- [ ] 키워드 검색량 조회 기능 완료
- [ ] API Route 테스트 완료

---

## 🎯 Day 3: 네이버 자동완성 구현

### 3.1 자동완성 API 분석 (1시간)
- [ ] 네이버 자동완성 엔드포인트 테스트
- [ ] 응답 형식 분석
- [ ] Rate limiting 확인

### 3.2 자동완성 서비스 구현 (2시간)
```typescript
// lib/services/naverAutoComplete.ts
```
- [ ] 자동완성 API 호출 함수
- [ ] 폴백 메커니즘 구현
- [ ] 응답 파싱 및 정규화

### 3.3 롱테일 키워드 생성기 구현 (1.5시간)
```typescript
// lib/services/longtailGenerator.ts
```
- [ ] 자동완성 결과 처리
- [ ] 기본 패턴 생성
- [ ] 중복 제거 로직

### 3.4 통합 테스트 (1시간)
- [ ] 다양한 키워드로 테스트
- [ ] 에러 핸들링 검증
- [ ] 성능 측정

### Day 3 완료 체크리스트
- [ ] 자동완성 API 연동 완료
- [ ] 롱테일 키워드 생성 완료
- [ ] 폴백 메커니즘 구현 완료

---

## 🎯 Day 4: Google Trends 연동

### 4.1 Google Trends API 패키지 설치 (30분)
```bash
pnpm add google-trends-api
pnpm add -D @types/google-trends-api
```

### 4.2 Google Trends 서비스 구현 (2시간)
```typescript
// lib/services/googleTrends.ts
```
- [ ] 일일 트렌드 수집 함수
- [ ] 데이터 파싱 및 정규화
- [ ] 에러 핸들링

### 4.3 API Route 구현 (1시간)
```typescript
// app/api/google/trends/route.ts
```
- [ ] GET 엔드포인트 구현
- [ ] 캐싱 로직 추가

### 4.4 데이터 통합 (1.5시간)
- [ ] Google 데이터를 통합 형식으로 변환
- [ ] 데이터베이스 저장 로직
- [ ] 중복 처리

### Day 4 완료 체크리스트
- [ ] Google Trends API 연동 완료
- [ ] 일일 트렌드 수집 기능 완료
- [ ] 데이터 정규화 완료

---

## 🎯 Day 5: YouTube API 연동

### 5.1 YouTube API 설정 (1시간)
- [ ] Google Cloud Console에서 프로젝트 생성
- [ ] YouTube Data API v3 활성화
- [ ] API 키 발급
- [ ] 환경 변수 추가

### 5.2 YouTube 서비스 구현 (2시간)
```typescript
// lib/services/youtubeApi.ts
```
- [ ] googleapis 패키지 설치
- [ ] 인기 동영상 조회 함수
- [ ] 키워드 추출 로직

### 5.3 키워드 추출기 구현 (1.5시간)
- [ ] 동영상 제목 파싱
- [ ] 태그 수집
- [ ] 빈도수 계산

### 5.4 통합 테스트 (30분)
- [ ] API 할당량 확인
- [ ] 데이터 품질 검증

### Day 5 완료 체크리스트
- [ ] YouTube API 연동 완료
- [ ] 키워드 추출 기능 완료
- [ ] 데이터 통합 완료

---

## 🎯 Day 6: UI 구현

### 6.1 레이아웃 구성 (1시간)
```typescript
// app/layout.tsx
// app/dashboard/layout.tsx
```
- [ ] 기본 레이아웃 설정
- [ ] 네비게이션 구현
- [ ] 반응형 디자인

### 6.2 대시보드 페이지 구현 (3시간)
```typescript
// app/dashboard/page.tsx
```
- [ ] 키워드 목록 컴포넌트
- [ ] 필터링 기능
- [ ] 새로고침 버튼
- [ ] 로딩 상태 처리

### 6.3 컴포넌트 개발 (2시간)
```typescript
// components/KeywordCard.tsx
// components/CompetitionBadge.tsx
// components/LoadingSpinner.tsx
```
- [ ] 재사용 가능한 컴포넌트
- [ ] 스타일링 (Tailwind CSS)
- [ ] 인터랙션 추가

### Day 6 완료 체크리스트
- [ ] 대시보드 UI 완성
- [ ] 반응형 디자인 적용
- [ ] 사용자 인터랙션 구현

---

## 🎯 Day 7: 통합 테스트 및 배포

### 7.1 통합 API 구현 (2시간)
```typescript
// app/api/collect/all/route.ts
```
- [ ] 모든 플랫폼 데이터 수집
- [ ] 데이터 병합 및 중복 제거
- [ ] 점수 계산 로직

### 7.2 전체 시스템 테스트 (2시간)
- [ ] E2E 테스트 시나리오
- [ ] 성능 테스트
- [ ] 에러 복구 테스트

### 7.3 Vercel 배포 (1시간)
- [ ] Vercel 계정 생성
- [ ] 프로젝트 연결
- [ ] 환경 변수 설정
- [ ] 배포 및 확인

### 7.4 문서화 (1시간)
- [ ] README.md 작성
- [ ] API 문서 작성
- [ ] 사용 가이드 작성

### Day 7 완료 체크리스트
- [ ] 전체 기능 통합 완료
- [ ] 배포 완료
- [ ] 문서화 완료

---

## 📊 작업 우선순위

### 필수 기능 (P0)
1. 네이버 검색광고 API 연동
2. 네이버 자동완성 기능
3. 기본 대시보드 UI
4. 데이터베이스 연동

### 중요 기능 (P1)
1. Google Trends 연동
2. YouTube API 연동
3. 점수 계산 로직
4. CSV 다운로드

### 선택 기능 (P2)
1. 자동화 스케줄링
2. 상세 필터링
3. 차트 시각화
4. 키워드 북마크

---

## 🐛 예상 이슈 및 대응 방안

### API 관련
- **Rate Limiting**: 캐싱 구현, 요청 간격 조절
- **인증 실패**: 환경 변수 검증, 에러 로깅
- **응답 지연**: 타임아웃 설정, 비동기 처리

### 데이터베이스 관련
- **중복 데이터**: UPSERT 사용, 유니크 제약
- **연결 오류**: 재시도 로직, 연결 풀 관리

### UI/UX 관련
- **로딩 시간**: 스켈레톤 UI, 페이지네이션
- **반응형 이슈**: 모바일 우선 디자인

---

## ✅ 일일 체크리스트 템플릿

### 작업 시작 전
- [ ] 이전 날 작업 내용 리뷰
- [ ] 오늘 목표 확인
- [ ] 개발 환경 준비

### 작업 중
- [ ] 커밋 메시지 작성 규칙 준수
- [ ] 코드 주석 추가
- [ ] 에러 핸들링 구현

### 작업 완료 후
- [ ] 기능 테스트
- [ ] 코드 리뷰 (자체)
- [ ] 다음 날 계획 수립

---

## 🚀 Post-MVP 로드맵

### Phase 2 (2주차)
- Vercel Cron Jobs 설정
- 키워드 그룹핑 기능
- 트렌드 차트 추가

### Phase 3 (3주차)
- AI 기반 콘텐츠 제목 생성
- 경쟁 분석 상세화
- 알림 기능 추가

### Phase 4 (4주차)
- 실제 트래픽 연동
- ROI 분석 대시보드
- 다국어 지원