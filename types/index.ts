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