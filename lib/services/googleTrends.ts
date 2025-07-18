import { getJson } from 'serpapi';
import type { SerpTrendItem, SerpTrendsResponse, InterestOverTimeData } from '@/lib/types/googleTrends';

export class GoogleTrendsService {
  private readonly apiKey: string;
  private readonly geo: string = 'KR';

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY || '';
    if (!this.apiKey) {
      throw new Error('SERPAPI_KEY 환경 변수가 설정되지 않았습니다.');
    }
  }

  /**
   * 일일 트렌드 수집
   */
  async getDailyTrends(): Promise<SerpTrendsResponse> {
    try {
      console.log('SerpAPI Google Trends 일일 트렌드 수집 시작...');

      const results = await getJson({
        engine: 'google_trends_trending_now',
        geo: this.geo,
        api_key: this.apiKey,
      });

      // 새로운 응답 형식에 맞게 수정
      const searchesData = results.trending_searches || results.daily_searches || [];

      if (!searchesData || searchesData.length === 0) {
        console.log('트렌드 데이터가 없습니다.');
        return {
          date: new Date().toISOString(),
          trends: [],
          searchMetadata: results.search_metadata || {}
        };
      }

      const trends: SerpTrendItem[] = searchesData.map((item: any) => ({
        query: item.query || item.search,
        exploreLink: item.explore_link || '',
        serpapi_link: item.serpapi_link || '',
        traffic: item.traffic || item.search_volume || undefined,
        related_queries: item.related_queries || []
      }));

      console.log(`${trends.length}개의 트렌드 수집 완료`);

      return {
        date: results.search_metadata?.created_at || new Date().toISOString(),
        trends,
        searchMetadata: results.search_metadata || {}
      };

    } catch (error) {
      console.error('SerpAPI Google Trends 수집 오류:', error);
      throw new Error('Google Trends 데이터 수집 실패');
    }
  }

  /**
   * 특정 키워드의 시간별 관심도 조회
   */
  async getInterestOverTime(keyword: string, timeframe: string = '7d'): Promise<InterestOverTimeData> {
    try {
      const results = await getJson({
        engine: 'google_trends',
        q: keyword,
        geo: this.geo,
        data_type: 'TIMESERIES',
        timeframe: timeframe,
        api_key: this.apiKey,
      });

      const timelineData = results.interest_over_time?.timeline_data || [];

      const data = timelineData.map((item: any) => ({
        timestamp: item.timestamp,
        value: item.values?.[0]?.value || 0
      }));

      return {
        keyword,
        data
      };

    } catch (error) {
      console.error(`키워드 "${keyword}" 관심도 조회 오류:`, error);
      return {
        keyword,
        data: []
      };
    }
  }

  /**
   * 연관 검색어 조회
   */
  async getRelatedQueries(keyword: string): Promise<string[]> {
    try {
      const results = await getJson({
        engine: 'google_trends',
        q: keyword,
        geo: this.geo,
        data_type: 'RELATED_QUERIES',
        api_key: this.apiKey,
      });

      const relatedQueries = results.related_queries?.top?.rankedKeyword || [];

      return relatedQueries.map((item: any) => item.query);

    } catch (error) {
      console.error(`키워드 "${keyword}" 연관 검색어 조회 오류:`, error);
      return [];
    }
  }
}

// 싱글톤 인스턴스 export (지연 초기화)
let googleTrendsServiceInstance: GoogleTrendsService | null = null;

export const googleTrendsService = {
  get instance(): GoogleTrendsService {
    if (!googleTrendsServiceInstance) {
      googleTrendsServiceInstance = new GoogleTrendsService();
    }
    return googleTrendsServiceInstance;
  },

  getDailyTrends(): Promise<any> {
    return this.instance.getDailyTrends();
  },

  getInterestOverTime(keyword: string, timeframe?: string): Promise<any> {
    return this.instance.getInterestOverTime(keyword, timeframe);
  },

  getRelatedQueries(keyword: string): Promise<string[]> {
    return this.instance.getRelatedQueries(keyword);
  }
};