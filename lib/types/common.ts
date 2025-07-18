export interface KeywordData {
  keyword: string;
  search_volume: number;
  competition_level: '낮음' | '중간' | '높음';
  cpc: number;
  score: number;
  platform: 'naver' | 'google' | 'youtube';
  metadata?: {
    related_queries?: string[];
    explore_link?: string;
    serpapi_link?: string;
    traffic_formatted?: string;
  };
}