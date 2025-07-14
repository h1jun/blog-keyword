import CryptoJS from 'crypto-js'
import { NaverKeywordData, NaverApiResponse } from '@/types/naver'

export class NaverApiService {
  private apiKey: string
  private secretKey: string
  private customerId: string
  private baseUrl = 'https://api.naver.com'

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
      'Content-Type': 'application/json',
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
    const url = `${this.baseUrl}${uri}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders('GET', uri),
        body: JSON.stringify({
          hintKeywords: keyword,
          showDetail: '1'
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data: NaverApiResponse = await response.json()
      
      // 입력한 키워드와 정확히 일치하는 데이터 찾기
      const keywordData = data.keywordList.find(
        item => item.relKeyword === keyword
      )

      return keywordData || null
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
    const url = `${this.baseUrl}${uri}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders('GET', uri),
        body: JSON.stringify({
          hintKeywords: keyword,
          showDetail: '1'
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data: NaverApiResponse = await response.json()
      
      // 연관 키워드 필터링 (원본 키워드 제외)
      return data.keywordList
        .filter(item => item.relKeyword !== keyword)
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
    const pc = data.monthlyPcQcCnt || 0
    const mobile = data.monthlyMobileQcCnt || 0
    return pc + mobile
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