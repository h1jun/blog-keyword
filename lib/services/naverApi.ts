import CryptoJS from 'crypto-js'
import { NaverKeywordData, NaverApiResponse } from '@/types/naver'

export class NaverApiService {
  private apiKey: string
  private secretKey: string
  private customerId: string
  private baseUrl = 'https://api.searchad.naver.com'

  constructor() {
    this.apiKey = process.env.NAVER_API_KEY!
    this.secretKey = process.env.NAVER_SECRET_KEY!
    this.customerId = process.env.NAVER_CUSTOMER_ID!
  }

  /**
   * HMAC-SHA256 서명 생성
   */
  private generateSignature(
      timestamp: string,
      method: string,
      uri: string
  ): string {
    const message = `${timestamp}.${method}.${uri}`
    return CryptoJS.enc.Base64.stringify(
        CryptoJS.HmacSHA256(message, this.secretKey)
    )
  }

  /**
   * API 요청 헤더 생성
   */
  private getHeaders(method: string, uri: string) {
    const timestamp = Date.now().toString()
    const signature = this.generateSignature(timestamp, method, uri)

    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Timestamp': timestamp,
      'X-API-KEY': this.apiKey,
      'X-Customer': this.customerId,
      'X-Signature': signature,
    }
  }

  /**
   * 키워드 데이터 조회
   */
  async getKeywordData(keyword: string): Promise<NaverKeywordData | null> {
    const uri = '/keywordstool'

    // 키워드 정규화 (모든 공백 제거)
    const normalizedKeyword = keyword.replace(/\s/g, '')

    // 쿼리 파라미터 구성 (URL 인코딩)
    const queryParams = new URLSearchParams({
      hintKeywords: normalizedKeyword,
      showDetail: '1'
    })

    const url = `${this.baseUrl}${uri}?${queryParams.toString()}`

    try {
      console.log('네이버 API 요청:', {
        originalKeyword: keyword,
        normalizedKeyword,
        url,
        method: 'GET',
        headers: this.getHeaders('GET', uri)
      })

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders('GET', uri)
      })

      console.log('네이버 API 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const data: NaverApiResponse = await response.json()
      console.log('네이버 API 응답 데이터:', data)

      // 키워드 매칭 로직 개선 (공백 제거하여 비교)
      const keywordData = data.keywordList.find(item => {
        const itemKeyword = item.relKeyword.replace(/\s/g, '').toLowerCase()
        const searchKeyword = normalizedKeyword.toLowerCase()

        // 정확한 일치 우선, 부분 일치 허용
        return itemKeyword === searchKeyword ||
            itemKeyword.includes(searchKeyword) ||
            searchKeyword.includes(itemKeyword)
      })

      // 데이터가 없으면 첫 번째 결과 반환 (있는 경우)
      return keywordData || (data.keywordList.length > 0 ? data.keywordList[0] : null)
    } catch (error) {
      console.error('네이버 API 호출 실패:', error)
      return null
    }
  }

  /**
   * 연관 키워드 조회
   */
  async getRelatedKeywords(
      keyword: string,
      limit: number = 10
  ): Promise<NaverKeywordData[]> {
    const uri = '/keywordstool'

    // 키워드 정규화 (모든 공백 제거)
    const normalizedKeyword = keyword.replace(/\s/g, '')

    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams({
      hintKeywords: normalizedKeyword,
      showDetail: '1'
    })

    const url = `${this.baseUrl}${uri}?${queryParams.toString()}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders('GET', uri)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const data: NaverApiResponse = await response.json()

      // 연관 키워드 필터링 (원본 키워드 제외, 공백 제거하여 비교)
      return data.keywordList
          .filter(item => item.relKeyword.replace(/\s/g, '') !== normalizedKeyword)
          .slice(0, limit)
    } catch (error) {
      console.error('연관 키워드 조회 실패:', error)
      return []
    }
  }

  /**
   * 검색량 합계 계산
   */
  calculateTotalVolume(data: NaverKeywordData): number {
    const pc = this.parseSearchVolume(data.monthlyPcQcCnt)
    const mobile = this.parseSearchVolume(data.monthlyMobileQcCnt)
    return pc + mobile
  }

  /**
   * 검색량 파싱 (< 10 같은 문자열 처리)
   */
  private parseSearchVolume(value: number | string | null): number {
    if (!value) return 0
    
    // 숫자인 경우 그대로 반환
    if (typeof value === 'number') return value
    
    // 문자열인 경우 파싱
    if (typeof value === 'string') {
      // "< 10" 같은 형태 처리
      if (value.includes('<')) {
        const match = value.match(/< (\d+)/)
        return match ? parseInt(match[1]) / 2 : 5 // < 10이면 5로 추정
      }
      
      // "> 1000" 같은 형태 처리
      if (value.includes('>')) {
        const match = value.match(/> (\d+)/)
        return match ? parseInt(match[1]) * 1.5 : 1000 // > 1000이면 1500으로 추정
      }
      
      // 일반 숫자 문자열
      const parsed = parseInt(value.replace(/[^0-9]/g, ''))
      return isNaN(parsed) ? 0 : parsed
    }
    
    return 0
  }

  /**
   * 경쟁도 점수 계산
   */
  calculateCompetitionScore(data: NaverKeywordData): number {
    const competition = data.compIdx
    const totalVolume = this.calculateTotalVolume(data)

    let baseScore = 0
    switch (competition) {
      case '낮음':
        baseScore = 85
        break
      case '중간':
        baseScore = 55
        break
      case '높음':
        baseScore = 25
        break
    }

    // 검색량에 따른 보정
    if (totalVolume < 100) baseScore -= 10
    else if (totalVolume > 10000) baseScore += 5

    return Math.max(0, Math.min(100, baseScore))
  }
}

// 싱글톤 인스턴스
export const naverApi = new NaverApiService()