# 블로그 키워드 자동 수집 시스템 PRD (MVP - 간소화 버전)

## **📋 프로젝트 개요**

### **프로젝트명**
개인용 블로그 키워드 자동 수집 시스템 (MVP)

### **사용자**
나 혼자 사용 (개인 블로그 운영자)

### **MVP 목표**
- Google, 네이버의 실시간 트렌드 데이터 기반 키워드 자동 수집
- 네이버 자동완성 API를 활용한 간단한 롱테일 키워드 확장
- 실용적이고 즉시 사용 가능한 키워드 발굴

### **핵심 가치**
- **Simple is Best**: 복잡한 분석보다 실용성 중심
- **Quick Win**: 빠르게 구현하고 즉시 활용
- **Cost Effective**: 완전 무료로 운영

---

## **🎯 MVP 핵심 기능 (간소화)**

### **1. Google Trends 기본 수집 (SerpAPI 활용)**

#### **1.1 구현 방법**
- **라이브러리**: serpapi (npm)
- **무료 제한**: 월 100회까지 무료 (MVP 단계에 충분)
- **수집 항목**: 일일/실시간 인기 검색어 수집

#### **1.2 간단한 구현**
```javascript
// SerpAPI를 활용한 일일 트렌드 수집
const results = await getJson({
  engine: 'google_trends_trending_now',
  geo: 'KR',
  api_key: process.env.SERPAPI_KEY,
});
```

### **2. 네이버 키워드 수집 (핵심만)**

#### **2.1 네이버 검색광고 API (메인)**
- 월간 검색량
- 경쟁정도 (낮음/중간/높음)
- CPC (상업성 판단용)

#### **2.2 간단한 경쟁도 판단**
```javascript
function getSimpleCompetitionScore(keywordData) {
    const competition = keywordData.compIdx;
    const totalVolume = (keywordData.monthlyPcQcCnt || 0) + (keywordData.monthlyMobileQcCnt || 0);
    
    // 단순 3단계 판단
    if (competition === '낮음' && totalVolume > 100) {
        return { score: 90, recommendation: '🟢 즉시 작성 추천' };
    } else if (competition === '중간') {
        return { score: 60, recommendation: '🟡 신중히 검토' };
    } else {
        return { score: 30, recommendation: '🔴 난이도 높음' };
    }
}
```

### **3. 데이터 통합 및 중복 제거**

#### **3.1 간단한 데이터 통합**
```javascript
// 네이버 + Google Trends 데이터 통합
function integrateKeywords(naverData, googleData) {
  const integrated = [];
  
  // 네이버 데이터 우선 (실제 검색량 있음)
  naverData.forEach(item => {
    integrated.push({
      ...item,
      source: 'naver',
      priority: 'high'
    });
  });
  
  // Google Trends 데이터 (중복 제거)
  googleData.forEach(item => {
    if (!integrated.find(existing => existing.keyword === item.keyword)) {
      integrated.push({
        ...item,
        source: 'google',
        priority: 'medium'
      });
    }
  });
  
  return integrated;
}
```

### **4. 롱테일 키워드 확장 (초간단 버전)**

#### **4.1 네이버 자동완성 API만 사용**
```javascript
async function getSimpleLongtailKeywords(seedKeyword) {
  try {
    // 1. 네이버 자동완성 호출
    const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(seedKeyword)}&con=0&frm=nv&ans=2&r_format=json&r_enc=UTF-8&st=100&q_enc=UTF-8`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://search.naver.com'
      }
    });
    
    const data = await response.json();
    
    // 2. 자동완성 결과 반환 (최대 10개)
    const autoCompleteKeywords = data.items[0].map(item => ({
      keyword: item[0],
      type: 'autocomplete'
    }));
    
    // 3. 연관 검색어 추가 (있는 경우)
    const relatedKeywords = data.items[1]?.map(item => ({
      keyword: item[0],
      type: 'related'
    })) || [];
    
    return [...autoCompleteKeywords, ...relatedKeywords];
    
  } catch (error) {
    console.error('자동완성 실패, 기본 패턴 사용');
    // 실패 시 기본 패턴 3개만 반환
    return [
      { keyword: `${seedKeyword} 추천`, type: 'pattern' },
      { keyword: `${seedKeyword} 후기`, type: 'pattern' },
      { keyword: `${seedKeyword} 가격`, type: 'pattern' }
    ];
  }
}
```

### **5. 간단한 통합 점수**

```javascript
function calculateSimpleScore(keyword) {
  const searchVolume = keyword.totalVolume || 0;
  const competition = keyword.competition || '높음';
  
  let score = 0;
  
  // 검색량 (50점)
  if (searchVolume >= 1000) score += 50;
  else if (searchVolume >= 500) score += 40;
  else if (searchVolume >= 100) score += 30;
  else score += 10;
  
  // 경쟁도 (50점)
  if (competition === '낮음') score += 50;
  else if (competition === '중간') score += 30;
  else score += 10;
  
  return score;
}
```

---

## **💻 MVP 기술 스택 (최소화)**

### **기술 스택**
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (무료 플랜)
- **Scheduling**: 수동 실행 → Vercel Cron (Phase 2)

### **간단한 데이터베이스 스키마**

```sql
-- 메인 키워드 테이블만
CREATE TABLE keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) UNIQUE NOT NULL,
    search_volume INTEGER,
    competition_level VARCHAR(20),
    cpc INTEGER,
    score INTEGER,
    platform VARCHAR(20), -- 'google', 'naver'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 롱테일 키워드 (심플)
CREATE TABLE longtail_keywords (
    id SERIAL PRIMARY KEY,
    parent_keyword VARCHAR(100),
    longtail_keyword VARCHAR(200) UNIQUE,
    source VARCHAR(50), -- 'autocomplete', 'related', 'pattern'
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## **📊 MVP 사용자 인터페이스 (초간단)**

### **메인 대시보드**
```
┌─────────────────────────────────────────────────┐
│  📊 키워드 트렌드 대시보드 (MVP)                 │
├─────────────────────────────────────────────────┤
│ [🔍 키워드 검색] [🔄 새로고침]                   │
├─────────────────────────────────────────────────┤
│ 📌 오늘의 추천 키워드                            │
│                                                 │
│ 1. "겨울 캠핑 용품" 🟢                          │
│    검색량: 5,420 | 경쟁도: 낮음                │
│    └─ 겨울 캠핑 용품 추천                      │
│    └─ 겨울 캠핑 용품 브랜드                    │
│                                                 │
│ 2. "챗GPT 엑셀" 🟡                              │
│    검색량: 12,300 | 경쟁도: 중간               │
│    └─ 챗GPT 엑셀 함수                          │
│    └─ 챗GPT 엑셀 자동화                        │
│                                                 │
│ 3. "2025 부동산 전망" 🔴                        │
│    검색량: 45,200 | 경쟁도: 높음               │
├─────────────────────────────────────────────────┤
│ 플랫폼: [전체] [Google] [네이버]                 │
│ [CSV 다운로드]                                  │
└─────────────────────────────────────────────────┘
```

---

## **🔄 MVP 운영 방식**

### **수동 → 자동화 단계적 적용**

#### **Phase 1 (MVP - 1주차)**
- 수동 실행 버튼으로 데이터 수집
- 하루 1-2번 수동으로 업데이트

#### **Phase 2 (2주차)**
- Vercel Cron Jobs 설정
- 일일 1회 자동 수집 (오전 9시)

```javascript
// vercel.json (Phase 2)
{
  "crons": [{
    "path": "/api/collect/all",
    "schedule": "0 0 * * *"  // 매일 오전 9시 (KST)
  }]
}
```

---

## **📈 MVP 성공 지표**

### **단순하고 명확한 KPI**
- **수집 성공률**: 90% 이상
- **일일 신규 키워드**: 10개 이상
- **실제 사용 키워드**: 주 2-3개

---

## **📅 MVP 개발 일정 (6일)**

### **빠른 구현 계획**
- **Day 1**: Next.js 프로젝트 설정, Supabase 연동
- **Day 2**: 네이버 검색광고 API 연동
- **Day 3**: 네이버 자동완성 구현
- **Day 4**: Google Trends 기본 연동 (SerpAPI 활용)
- **Day 5**: UI 구현 (기본 대시보드)
- **Day 6**: 통합 테스트 및 배포

---

## **💻 MVP 핵심 구현 코드**

### **통합 API Route**
```typescript
// /app/api/collect/all/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const results = {
      naver: [],
      google: []
    };
    
    // 1. 네이버 트렌드 키워드 수집 (예시)
    const naverTrends = ['겨울 캠핑', '챗GPT 활용', '2025 전망'];
    
    for (const keyword of naverTrends) {
      // 검색량 조회
      const keywordData = await getNaverKeywordData(keyword);
      
      // 롱테일 확장
      const longtails = await getSimpleLongtailKeywords(keyword);
      
      results.naver.push({
        keyword,
        data: keywordData,
        longtails
      });
    }
    
    // 2. Google Trends (일일 트렌드만)
    const googleTrends = await getGoogleDailyTrends();
    results.google = googleTrends.slice(0, 10);
    
    // 3. DB 저장
    await saveToDatabase(results);
    
    return NextResponse.json({ 
      success: true, 
      count: {
        naver: results.naver.length,
        google: results.google.length
      }
    });
    
  } catch (error) {
    console.error('수집 실패:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

async function saveToDatabase(results) {
  const keywords = [];
  
  // 네이버 키워드
  results.naver.forEach(item => {
    keywords.push({
      keyword: item.keyword,
      search_volume: item.data.totalVolume,
      competition_level: item.data.competition,
      cpc: item.data.cpc,
      score: calculateSimpleScore(item.data),
      platform: 'naver'
    });
  });
  
  // 일괄 저장
  const { error } = await supabase
    .from('keywords')
    .upsert(keywords, { 
      onConflict: 'keyword',
      ignoreDuplicates: false 
    });
    
  if (error) throw error;
}
```

### **간단한 대시보드 컴포넌트**
```typescript
// /app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchKeywords();
  }, []);
  
  const fetchKeywords = async () => {
    const { data } = await supabase
      .from('keywords')
      .select('*')
      .order('score', { ascending: false })
      .limit(20);
      
    setKeywords(data || []);
  };
  
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collect/all', {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchKeywords();
        alert('키워드 업데이트 완료!');
      }
    } catch (error) {
      alert('업데이트 실패');
    }
    setLoading(false);
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">키워드 트렌드 대시보드</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '업데이트 중...' : '새로고침'}
          </button>
        </div>
        
        <div className="space-y-4">
          {keywords.map((keyword, index) => (
            <div key={keyword.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {index + 1}. {keyword.keyword}
                  </h3>
                  <p className="text-sm text-gray-600">
                    검색량: {keyword.search_volume?.toLocaleString() || '-'} | 
                    경쟁도: {keyword.competition_level || '-'} |
                    점수: {keyword.score || 0}
                  </p>
                </div>
                <CompetitionBadge level={keyword.competition_level} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompetitionBadge({ level }) {
  const colors = {
    '낮음': 'bg-green-100 text-green-800',
    '중간': 'bg-yellow-100 text-yellow-800',
    '높음': 'bg-red-100 text-red-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-sm ${colors[level] || 'bg-gray-100'}`}>
      {level === '낮음' ? '🟢' : level === '중간' ? '🟡' : '🔴'} {level}
    </span>
  );
}
```

---

## **🚀 MVP 이후 계획**

### **Phase 2 (2-3주차)**
- 자동화 스케줄링 적용
- 상세 경쟁 분석 추가
- 키워드 그룹핑 기능

### **Phase 3 (4주차 이후)**
- AI 콘텐츠 제목 생성
- 실제 트래픽 연동
- 성과 추적 대시보드

---

## **📝 MVP 체크리스트**

**개발 시작 전 준비사항**:
- [x] Supabase 프로젝트 생성
- [x] 네이버 검색광고 API 키 발급
- [x] SerpAPI 계정 생성 및 키 발급 (월 100회 무료)
- [x] Next.js 프로젝트 생성
- [x] 환경변수 설정 (.env.local)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NAVER_API_KEY=your_naver_api_key
NAVER_SECRET_KEY=your_naver_secret_key
NAVER_CUSTOMER_ID=your_customer_id
SERPAPI_KEY=your_serpapi_key
```

---

## **✨ MVP 핵심 원칙**

1. **Keep It Simple**: 복잡한 기능은 나중에
2. **Focus on Value**: 실제 사용할 키워드 발굴에 집중
3. **Quick Iteration**: 빠르게 만들고 계속 개선
4. **Cost Free**: 완전 무료로 운영

이 MVP는 **6일 안에 완성**하여 실제 블로그 운영에 즉시 활용할 수 있도록 설계되었습니다.