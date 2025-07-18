export interface SerpTrendItem {
  query: string;
  exploreLink: string;
  serpapi_link: string;
  traffic?: string;
  related_queries?: Array<{
    query: string;
    value: number;
  }>;
}

export interface SerpTrendsResponse {
  date: string;
  trends: SerpTrendItem[];
  searchMetadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    serpapi_version: string;
    total_time_taken: number;
  };
}

export interface InterestOverTimeData {
  keyword: string;
  data: Array<{
    timestamp: string;
    value: number;
  }>;
}

export interface GoogleTrendsUsage {
  currentCount: number;
  maxCount: number;
  resetDate: string;
  lastUpdated: string;
}