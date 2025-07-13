# Day 7: 기본 UI 구현 가이드

## 📋 Day 7 목표
Phase 1의 마지막 날로, 지금까지 구축한 API들을 활용한 기본 UI를 구현합니다.

### 주요 목표
1. ✅ 메인 대시보드 UI 구현
2. ✅ 키워드 목록 표시 기능
3. ✅ 실시간 데이터 수집 상태 표시
4. ✅ 기본 필터링 및 정렬 기능
5. ✅ 반응형 디자인 적용

## 🎯 작업 단위별 구현 가이드

### 작업 1: 레이아웃 컴포넌트 구조화 (30분)

#### 1.1 메인 레이아웃 컴포넌트
```typescript
// components/layout/MainLayout.tsx
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
  youtubeScore: number;
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
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="text-sm">
                  YouTube: {keyword.youtubeScore > 0 ? `${keyword.youtubeScore}점` : '데이터 없음'}
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
  Youtube, 
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
    { icon: Youtube, label: 'YouTube 트렌드', href: '/trends/youtube' },
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
      youtubeScore: item.youtube_score || 0,
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
- Day 5: YouTube API 연동 ✅
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
