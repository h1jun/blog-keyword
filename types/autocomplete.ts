export interface AutoCompleteResponse {
  query: string
  items: [string[], string[][]]
  // items[0]: 자동완성 키워드 배열
  // items[1]: 연관 검색어 배열 (있는 경우)
}

export interface LongtailKeyword {
  keyword: string
  type: 'autocomplete' | 'related' | 'pattern'
  order?: number
}

export interface AutoCompleteResult {
  success: boolean
  keywords: LongtailKeyword[]
  source: 'api' | 'fallback'
}