# Day 1: 프로젝트 초기 설정 가이드

## 🎯 오늘의 목표
Next.js 프로젝트를 생성하고 Supabase와 연동하여 기본 개발 환경을 구축합니다.

---

## 📋 작업 체크리스트

### 1. 프로젝트 생성 (30분)

```bash
# 프로젝트 생성
pnpm create next-app@latest . --typescript --tailwind --app

# Git 초기화 (이미 되어있지 않은 경우)
git init
git add .
git commit -m "Initial commit"
```

### 2. 프로젝트 구조 설정 (20분)

다음 폴더 구조를 생성합니다:

```bash
# 폴더 생성
mkdir -p app/api/collect
mkdir -p app/api/naver
mkdir -p app/api/google
mkdir -p app/api/youtube
mkdir -p app/dashboard
mkdir -p lib/services
mkdir -p lib/utils
mkdir -p components/ui
mkdir -p types
```

### 3. 필수 패키지 설치 (20분)

```bash
# Supabase 클라이언트
pnpm add @supabase/supabase-js

# HTTP 요청
pnpm add axios

# 환경 변수 타입 안전성
pnpm add zod

# 날짜 처리
pnpm add date-fns

# 개발 의존성
pnpm add -D @types/node
```

### 4. TypeScript 설정 (10분)

`tsconfig.json` 파일 수정:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 5. 환경 변수 설정 (15분)

`.env.local` 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 나중에 추가할 API 키들
# NAVER_API_KEY=
# NAVER_SECRET_KEY=
# NAVER_CUSTOMER_ID=
# YOUTUBE_API_KEY=
```

`.env.example` 파일도 생성 (실제 값 없이):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Naver API
NAVER_API_KEY=
NAVER_SECRET_KEY=
NAVER_CUSTOMER_ID=

# YouTube API
YOUTUBE_API_KEY=
```

### 6. Supabase 프로젝트 설정 (30분)

1. [Supabase](https://supabase.com) 접속
2. 새 프로젝트 생성
3. SQL Editor에서 다음 쿼리 실행:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Keywords 테이블
CREATE TABLE keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword VARCHAR(100) UNIQUE NOT NULL,
    search_volume INTEGER DEFAULT 0,
    competition_level VARCHAR(20) CHECK (competition_level IN ('낮음', '중간', '높음')),
    cpc INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    platform VARCHAR(20) CHECK (platform IN ('google', 'naver', 'youtube', 'integrated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Longtail Keywords 테이블
CREATE TABLE longtail_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_keyword VARCHAR(100) NOT NULL,
    longtail_keyword VARCHAR(200) UNIQUE NOT NULL,
    source VARCHAR(50) CHECK (source IN ('autocomplete', 'related', 'pattern')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_keywords_score ON keywords(score DESC);
CREATE INDEX idx_keywords_platform ON keywords(platform);
CREATE INDEX idx_keywords_created ON keywords(created_at DESC);
CREATE INDEX idx_longtail_parent ON longtail_keywords(parent_keyword);

-- Updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger 생성
CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7. Supabase 클라이언트 설정 (20분)

`lib/supabase.ts` 파일 생성:

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### 8. 타입 정의 (20분)

`types/index.ts` 파일 생성:

```typescript
export interface Keyword {
  id: string
  keyword: string
  search_volume: number
  competition_level: '낮음' | '중간' | '높음'
  cpc: number
  score: number
  platform: 'google' | 'naver' | 'youtube' | 'integrated'
  created_at: string
  updated_at: string
}

export interface LongtailKeyword {
  id: string
  parent_keyword: string
  longtail_keyword: string
  source: 'autocomplete' | 'related' | 'pattern'
  created_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### 9. 기본 레이아웃 설정 (20분)

`app/layout.tsx` 파일 수정:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '키워드 수집 시스템',
  description: '블로그 키워드 자동 수집 및 분석 도구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <h1 className="text-xl font-semibold">키워드 수집기</h1>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
```

### 10. 홈페이지 설정 (15분)

`app/page.tsx` 파일 수정:

```typescript
import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          블로그 키워드 자동 수집 시스템
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Google, 네이버, YouTube의 트렌드를 한 곳에서 확인하세요
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  )
}
```

### 11. 테스트 페이지 생성 (15분)

`app/test-db/page.tsx` 파일 생성 (DB 연결 테스트용):

```typescript
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDB() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      // 테스트 데이터 삽입
      const { data, error } = await supabase
        .from('keywords')
        .insert({
          keyword: '테스트 키워드',
          search_volume: 1000,
          competition_level: '낮음',
          cpc: 500,
          score: 80,
          platform: 'naver'
        })
        .select()

      if (error) {
        setResult(`Error: ${error.message}`)
      } else {
        setResult(`Success: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`Error: ${err}`)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '테스트 중...' : 'DB 연결 테스트'}
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {result}
        </pre>
      )}
    </div>
  )
}
```

### 12. Git 커밋 (10분)

```bash
# 변경사항 확인
git status

# 모든 파일 추가
git add .

# 커밋
git commit -m "feat: 프로젝트 초기 설정 완료
- Next.js 프로젝트 생성
- Supabase 연동
- 기본 타입 정의
- 데이터베이스 스키마 생성"
```

---

## 🎉 Day 1 완료!

### 완료 사항
- ✅ Next.js 프로젝트 생성
- ✅ Supabase 데이터베이스 설정
- ✅ 기본 프로젝트 구조 생성
- ✅ 타입 정의
- ✅ DB 연결 테스트

### 다음 단계 미리보기
내일은 네이버 검색광고 API를 연동하여 키워드 검색량과 경쟁도 데이터를 수집하는 기능을 구현합니다.

### 트러블슈팅
- Supabase 연결 오류: 환경 변수가 올바른지 확인
- TypeScript 오류: `pnpm run type-check` 실행하여 타입 오류 확인
- 빌드 오류: `pnpm run build` 실행하여 빌드 가능한지 확인