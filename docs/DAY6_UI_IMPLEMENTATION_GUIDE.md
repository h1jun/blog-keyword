# Day 6: UI 구현 가이드

## 📋 개요
사용자 친화적인 대시보드 UI를 구현하여 수집된 키워드 데이터를 효과적으로 표시하고 관리할 수 있도록 합니다.

## 🎯 Day 6 목표
- 반응형 레이아웃 구성
- 대시보드 메인 페이지 구현
- 재사용 가능한 컴포넌트 개발
- 실시간 데이터 업데이트 기능
- 사용자 인터랙션 추가

## 📚 사전 준비

### 1. UI 라이브러리 설치
```bash
# 아이콘 라이브러리
pnpm add lucide-react

# 날짜 포맷팅
pnpm add date-fns

# 차트 라이브러리 (선택사항)
pnpm add recharts

# 클래스 이름 유틸리티
pnpm add clsx
```

### 2. 전역 스타일 설정
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 🔧 구현 단계

### Step 1: 타입 정의 (30분)

#### 1.1 공통 타입 정의
```typescript
// lib/types/common.ts
export interface KeywordData {
  id?: number;
  keyword: string;
  search_volume: number;
  competition_level: string;
  cpc: number;
  score: number;
  platform: 'google' | 'naver' | 'youtube';
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Stats {
  total: number;
  google: number;
  naver: number;
  youtube: number;
  lowCompetition: number;
}
```

### Step 2: 레이아웃 구성 (1시간)

#### 2.1 Root Layout
```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '키워드 트렌드 대시보드',
  description: '멀티플랫폼 키워드 자동 수집 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

#### 2.2 대시보드 레이아웃
```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
```

### Step 3: 유틸리티 함수 (15분)

#### 3.1 클래스 이름 유틸리티
```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

### Step 4: UI 컴포넌트 구현 (2시간)

#### 4.1 CompetitionBadge 컴포넌트
```typescript
// components/CompetitionBadge.tsx
import { cn } from '@/lib/utils';

interface CompetitionBadgeProps {
  level?: string;
}

export function CompetitionBadge({ level }: CompetitionBadgeProps) {
  const getStyle = () => {
    switch (level) {
      case '낮음':
        return {
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: '🟢',
          label: '낮음'
        };
      case '중간':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '🟡',
          label: '중간'
        };
      case '높음':
        return {
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: '🔴',
          label: '높음'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⚪',
          label: '미정'
        };
    }
  };
  
  const style = getStyle();
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        style.className
      )}
    >
      <span>{style.icon}</span>
      <span>{style.label}</span>
    </span>
  );
}
```

#### 4.2 PlatformBadge 컴포넌트
```typescript
// components/PlatformBadge.tsx
import { Globe, Search, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformBadgeProps {
  platform: string;
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const getPlatformInfo = () => {
    switch (platform) {
      case 'google':
        return {
          icon: Globe,
          label: 'Google',
          className: 'bg-blue-100 text-blue-700'
        };
      case 'naver':
        return {
          icon: Search,
          label: '네이버',
          className: 'bg-green-100 text-green-700'
        };
      case 'youtube':
        return {
          icon: Youtube,
          label: 'YouTube',
          className: 'bg-red-100 text-red-700'
        };
      default:
        return {
          icon: Globe,
          label: platform,
          className: 'bg-gray-100 text-gray-700'
        };
    }
  };
  
  const info = getPlatformInfo();
  const Icon = info.icon;
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
        info.className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{info.label}</span>
    </span>
  );
}
```

#### 4.3 KeywordCard 컴포넌트
```typescript
// components/KeywordCard.tsx
'use client';

import { TrendingUp, Users, DollarSign } from 'lucide-react';
import { CompetitionBadge } from './CompetitionBadge';
import { PlatformBadge } from './PlatformBadge';
import { formatNumber } from '@/lib/utils';
import type { KeywordData } from '@/lib/types/common';

interface KeywordCardProps {
  keyword: KeywordData;
  rank: number;
}

export function KeywordCard({ keyword, rank }: KeywordCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-400">#{rank}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{keyword.keyword}</h3>
            <div className="flex items-center gap-2 mt-1">
              <PlatformBadge platform={keyword.platform} />
              <CompetitionBadge level={keyword.competition_level} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">검색량:</span>
          <span className="font-medium">{formatNumber(keyword.search_volume || 0)}</span>
        </div>
        
        {keyword.cpc > 0 && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">CPC:</span>
            <span className="font-medium">₩{formatNumber(keyword.cpc)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">점수:</span>
          <span className="font-medium">{keyword.score}/100</span>
        </div>
      </div>
    </div>
  );
}
```

#### 4.4 StatsCard 컴포넌트
```typescript
// components/StatsCard.tsx
import { LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  subtitle?: string;
}

export function StatsCard({ title, value, icon: Icon, color, bgColor, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatNumber(value)}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", bgColor)}>
          <Icon className={cn("h-6 w-6", color)} />
        </div>
      </div>
    </div>
  );
}
```

#### 4.5 LoadingSpinner 컴포넌트
```typescript
// components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

#### 4.6 EmptyState 컴포넌트
```typescript
// components/EmptyState.tsx
import { Search } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "데이터가 없습니다" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <Search className="h-12 w-12 mb-4 text-gray-300" />
      <p className="text-lg">{message}</p>
      <p className="text-sm mt-2">새로고침 버튼을 눌러 데이터를 수집해주세요.</p>
    </div>
  );
}
```

### Step 5: 대시보드 페이지 구현 (1시간 30분)

#### 5.1 대시보드 메인 페이지
```typescript
// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Globe, Search as SearchIcon, Youtube, Download } from 'lucide-react';
import { KeywordCard } from '@/components/KeywordCard';
import { StatsCard } from '@/components/StatsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import type { KeywordData, Stats } from '@/lib/types/common';

export default function DashboardPage() {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [filteredKeywords, setFilteredKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'google' | 'naver' | 'youtube'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    google: 0,
    naver: 0,
    youtube: 0,
    lowCompetition: 0,
  });
  
  useEffect(() => {
    fetchKeywords();
  }, []);
  
  useEffect(() => {
    filterKeywords();
  }, [keywords, activeFilter, searchQuery]);
  
  const fetchKeywords = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const keywordData = data || [];
      setKeywords(keywordData);
      
      // 통계 계산
      setStats({
        total: keywordData.length,
        google: keywordData.filter(k => k.platform === 'google').length,
        naver: keywordData.filter(k => k.platform === 'naver').length,
        youtube: keywordData.filter(k => k.platform === 'youtube').length,
        lowCompetition: keywordData.filter(k => k.competition_level === '낮음').length,
      });
      
    } catch (error) {
      console.error('키워드 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/collect/all', {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchKeywords();
      }
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const filterKeywords = () => {
    let filtered = keywords;
    
    // 플랫폼 필터
    if (activeFilter !== 'all') {
      filtered = filtered.filter(k => k.platform === activeFilter);
    }
    
    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(k => 
        k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredKeywords(filtered);
  };
  
  const handleExportCSV = () => {
    const csv = [
      ['순위', '키워드', '플랫폼', '검색량', '경쟁도', 'CPC', '점수'],
      ...filteredKeywords.map((k, i) => [
        i + 1,
        k.keyword,
        k.platform,
        k.search_volume || 0,
        k.competition_level || '',
        k.cpc || 0,
        k.score || 0
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `keywords_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">키워드 트렌드 대시보드</h1>
          <p className="text-gray-600 mt-1">실시간으로 수집된 트렌드 키워드를 확인하세요</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            CSV 다운로드
          </button>
        </div>
      </div>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="전체 키워드"
          value={stats.total}
          icon={TrendingUp}
          color="text-blue-600"
          bgColor="bg-blue-100"
          subtitle={`경쟁도 낮음: ${stats.lowCompetition}개`}
        />
        <StatsCard
          title="Google 트렌드"
          value={stats.google}
          icon={Globe}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatsCard
          title="네이버 키워드"
          value={stats.naver}
          icon={SearchIcon}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="YouTube 키워드"
          value={stats.youtube}
          icon={Youtube}
          color="text-red-600"
          bgColor="bg-red-100"
        />
      </div>
      
      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['all', 'google', 'naver', 'youtube'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filter === 'all' ? '전체' : filter === 'naver' ? '네이버' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* 키워드 목록 */}
      <div className="space-y-4">
        {filteredKeywords.length === 0 ? (
          <EmptyState message="검색 결과가 없습니다" />
        ) : (
          filteredKeywords.map((keyword, index) => (
            <KeywordCard
              key={keyword.id || index}
              keyword={keyword}
              rank={index + 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

### Step 6: 홈페이지 리다이렉트 (15분)

#### 6.1 홈페이지 설정
```typescript
// app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
}
```

## 🔍 트러블슈팅

### 1. Hydration 에러 해결
```typescript
// 동적 import 사용
import dynamic from 'next/dynamic';

const DashboardContent = dynamic(
  () => import('@/components/DashboardContent'),
  { ssr: false }
);
```

### 2. 성능 최적화
```typescript
// React.memo 사용
export const KeywordCard = React.memo(({ keyword, rank }: KeywordCardProps) => {
  // 컴포넌트 구현
});

// useMemo로 필터링 최적화
const filteredKeywords = useMemo(() => {
  return keywords.filter(/* 필터 로직 */);
}, [keywords, activeFilter, searchQuery]);
```

### 3. 에러 처리
```typescript
// 에러 바운더리 구현
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>오류가 발생했습니다. 페이지를 새로고침해주세요.</div>;
    }
    
    return this.props.children;
  }
}
```

## ✅ Day 6 체크리스트

### 완료 항목
- [ ] 프로젝트 구조 설정
- [ ] 전역 스타일 설정
- [ ] 타입 정의
- [ ] 유틸리티 함수 구현
- [ ] UI 컴포넌트 개발
  - [ ] CompetitionBadge
  - [ ] PlatformBadge
  - [ ] KeywordCard
  - [ ] StatsCard
  - [ ] LoadingSpinner
  - [ ] EmptyState
- [ ] 대시보드 페이지 구현
- [ ] 필터링 기능
- [ ] 검색 기능
- [ ] CSV 다운로드 기능
- [ ] 반응형 디자인

### 테스트 항목
- [ ] 데이터 로딩 확인
- [ ] 필터 동작 확인
- [ ] 검색 기능 테스트
- [ ] 새로고침 테스트
- [ ] CSV 다운로드 테스트
- [ ] 모바일 반응형 확인
- [ ] 에러 상황 처리

## 📝 다음 단계 (Day 7)
- 통합 API 구현
- 전체 시스템 테스트
- 성능 최적화
- Vercel 배포
- 문서화 작성
