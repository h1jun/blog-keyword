export interface NaverKeywordData {
  relKeyword: string
  monthlyPcQcCnt: number | string | null
  monthlyMobileQcCnt: number | string | null
  monthlyAvePcClkCnt: number | null
  monthlyAveMobileClkCnt: number | null
  monthlyAvePcCtr: number | null
  monthlyAveMobileCtr: number | null
  plAvgDepth: number
  compIdx: '낮음' | '중간' | '높음'
  avgCpc?: number
}

export interface NaverApiResponse {
  keywordList: NaverKeywordData[]
}

export interface NaverApiError {
  code: string
  message: string
}