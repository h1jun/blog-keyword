import type { SerpTrendItem } from '@/lib/types/googleTrends';
import type { KeywordData } from '@/lib/types/common';

export function transformSerpTrendsData(trends: SerpTrendItem[]): KeywordData[] {
  return trends.map((trend, index) => {
    // 트래픽을 숫자로 변환 (예: "100K+" -> 100000)
    const trafficValue = parseTrafficValue(trend.traffic);
    
    // Google Trends는 경쟁도를 제공하지 않으므로 트래픽 기반으로 추정
    const competitionLevel = estimateCompetition(trafficValue);
    
    // 점수 계산 (트렌드 순위와 트래픽 기반)
    const score = calculateTrendScore(index, trafficValue);
    
    return {
      keyword: trend.query,
      search_volume: trafficValue,
      competition_level: competitionLevel,
      cpc: 0, // Google Trends는 CPC 정보 없음
      score,
      platform: 'google',
      metadata: {
        related_queries: trend.related_queries?.map(q => q.query) || [],
        explore_link: trend.exploreLink,
        serpapi_link: trend.serpapi_link,
        traffic_formatted: trend.traffic
      }
    };
  });
}

function parseTrafficValue(traffic?: string | number): number {
  if (!traffic || traffic === 'N/A') return 0;
  
  // 이미 숫자인 경우 그대로 반환
  if (typeof traffic === 'number') {
    return traffic;
  }
  
  // 문자열인 경우에만 문자열 처리
  if (typeof traffic === 'string') {
    // "100K+" -> 100000, "1M+" -> 1000000
    const value = traffic.replace(/[+,]/g, '');
    const multiplier = value.includes('K') ? 1000 : value.includes('M') ? 1000000 : 1;
    const numericValue = parseFloat(value.replace(/[KM]/g, ''));
    
    return Math.round(numericValue * multiplier);
  }
  
  return 0;
}

function estimateCompetition(trafficValue: number): '낮음' | '중간' | '높음' {
  if (trafficValue >= 1000000) return '높음';
  if (trafficValue >= 100000) return '중간';
  return '낮음';
}

function calculateTrendScore(rank: number, trafficValue: number): number {
  // 순위 점수 (1위: 50점, 2위: 45점, ...)
  const rankScore = Math.max(50 - (rank * 5), 0);
  
  // 트래픽 점수 (최대 50점)
  let trafficScore = 0;
  if (trafficValue >= 1000000) trafficScore = 50;
  else if (trafficValue >= 500000) trafficScore = 40;
  else if (trafficValue >= 100000) trafficScore = 30;
  else if (trafficValue >= 50000) trafficScore = 20;
  else if (trafficValue >= 10000) trafficScore = 10;
  else trafficScore = 5;
  
  return rankScore + trafficScore;
}