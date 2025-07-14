export type Database = {
  public: {
    Tables: {
      keywords: {
        Row: {
          id: string
          keyword: string
          search_volume: number | null
          competition_level: '낮음' | '중간' | '높음' | null
          cpc: number | null
          score: number | null
          platform: 'google' | 'naver' | 'youtube' | 'integrated' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          keyword: string
          search_volume?: number | null
          competition_level?: '낮음' | '중간' | '높음' | null
          cpc?: number | null
          score?: number | null
          platform?: 'google' | 'naver' | 'youtube' | 'integrated' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          keyword?: string
          search_volume?: number | null
          competition_level?: '낮음' | '중간' | '높음' | null
          cpc?: number | null
          score?: number | null
          platform?: 'google' | 'naver' | 'youtube' | 'integrated' | null
          created_at?: string
          updated_at?: string
        }
      }
      longtail_keywords: {
        Row: {
          id: string
          parent_keyword: string
          longtail_keyword: string
          source: 'autocomplete' | 'related' | 'pattern' | null
          created_at: string
        }
        Insert: {
          id?: string
          parent_keyword: string
          longtail_keyword: string
          source?: 'autocomplete' | 'related' | 'pattern' | null
          created_at?: string
        }
        Update: {
          id?: string
          parent_keyword?: string
          longtail_keyword?: string
          source?: 'autocomplete' | 'related' | 'pattern' | null
          created_at?: string
        }
      }
    }
  }
}