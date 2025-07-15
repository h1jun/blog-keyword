import { LongtailKeyword, AutoCompleteResult } from '@/types/autocomplete'

export class AutoCompleteManager {
  private failureCount: number = 0
  private lastFailureTime: number | null = null
  private readonly backoffTime: number = 1000 // 1초
  private readonly maxFailures: number = 3

  /**
   * 자동완성 API 호출 가능 여부 확인
   */
  private canCallApi(): boolean {
    if (this.failureCount < this.maxFailures) {
      return true
    }

    if (!this.lastFailureTime) {
      return true
    }

    const timeSinceFailure = Date.now() - this.lastFailureTime
    const requiredWaitTime = this.backoffTime * this.failureCount

    return timeSinceFailure >= requiredWaitTime
  }

  /**
   * 실패 카운터 리셋
   */
  private resetFailureCount(): void {
    this.failureCount = 0
    this.lastFailureTime = null
  }

  /**
   * 실패 기록
   */
  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
  }

  /**
   * 네이버 자동완성 API 호출
   */
  async getAutoComplete(keyword: string): Promise<AutoCompleteResult> {
    // API 호출 가능 여부 확인
    if (!this.canCallApi()) {
      console.log('자동완성 API 일시 중단, 폴백 모드 사용')
      return this.getFallbackKeywords(keyword)
    }

    try {
      // 랜덤 딜레이 추가 (100-300ms)
      await this.randomDelay()

      const url = this.buildAutoCompleteUrl(keyword)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://search.naver.com',
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // 성공 시 실패 카운터 리셋
      this.resetFailureCount()
      
      return this.parseAutoCompleteResponse(data)
    } catch (error) {
      console.error('자동완성 API 호출 실패:', error)
      this.recordFailure()
      
      // 폴백 모드로 전환
      return this.getFallbackKeywords(keyword)
    }
  }

  /**
   * 자동완성 URL 생성
   */
  private buildAutoCompleteUrl(keyword: string): string {
    const params = new URLSearchParams({
      q: keyword,
      con: '0',
      frm: 'nv',
      ans: '2',
      r_format: 'json',
      r_enc: 'UTF-8',
      st: '100',
      q_enc: 'UTF-8',
    })

    return `https://ac.search.naver.com/nx/ac?${params.toString()}`
  }

  /**
   * 자동완성 응답 파싱
   */
  private parseAutoCompleteResponse(data: any): AutoCompleteResult {
    const keywords: LongtailKeyword[] = []

    // 자동완성 키워드 처리
    if (data.items && data.items[0]) {
      data.items[0].forEach((item: string[], index: number) => {
        keywords.push({
          keyword: item[0],
          type: 'autocomplete',
          order: index + 1,
        })
      })
    }

    // 연관 검색어 처리
    if (data.items && data.items[1]) {
      data.items[1].forEach((item: string[], index: number) => {
        keywords.push({
          keyword: item[0],
          type: 'related',
          order: index + 1,
        })
      })
    }

    return {
      success: true,
      keywords,
      source: 'api',
    }
  }

  /**
   * 폴백 키워드 생성
   */
  private getFallbackKeywords(keyword: string): AutoCompleteResult {
    const patterns = ['추천', '후기', '가격', '비교', '순위', '종류', '방법']
    
    const keywords: LongtailKeyword[] = patterns
      .slice(0, 3) // 기본 3개만 사용
      .map((pattern, index) => ({
        keyword: `${keyword} ${pattern}`,
        type: 'pattern' as const,
        order: index + 1,
      }))

    return {
      success: true,
      keywords,
      source: 'fallback',
    }
  }

  /**
   * 랜덤 딜레이
   */
  private async randomDelay(): Promise<void> {
    const delay = 100 + Math.random() * 200 // 100-300ms
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// 싱글톤 인스턴스
export const autoCompleteManager = new AutoCompleteManager()