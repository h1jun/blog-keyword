import { autoCompleteManager } from './autoCompleteManager'
import { naverApi } from './naverApi'
import { LongtailKeyword } from '@/types/autocomplete'

export interface LongtailResult {
  parentKeyword: string
  longtails: Array<{
    keyword: string
    type: 'autocomplete' | 'related' | 'pattern'
    searchVolume?: number
    competition?: string
    score?: number
  }>
  totalCount: number
  source: 'api' | 'fallback'
}

export class LongtailGenerator {
  /**
   * 롱테일 키워드 생성 (간단 버전)
   */
  async generateSimple(seedKeyword: string): Promise<LongtailResult> {
    // 1. 자동완성 데이터 수집
    const autoCompleteResult = await autoCompleteManager.getAutoComplete(seedKeyword)
    
    // 2. 중복 제거 및 정리
    const uniqueKeywords = this.removeDuplicates(autoCompleteResult.keywords)
    
    // 3. 최대 20개로 제한
    const limitedKeywords = uniqueKeywords.slice(0, 20)
    
    return {
      parentKeyword: seedKeyword,
      longtails: limitedKeywords.map(kw => ({
        keyword: kw.keyword,
        type: kw.type,
      })),
      totalCount: limitedKeywords.length,
      source: autoCompleteResult.source,
    }
  }

  /**
   * 롱테일 키워드 생성 (검색량 포함)
   */
  async generateWithVolume(seedKeyword: string): Promise<LongtailResult> {
    // 1. 기본 롱테일 생성
    const basicResult = await this.generateSimple(seedKeyword)
    
    // 2. 검색량 조회 (선택적)
    const enrichedLongtails = await this.enrichWithSearchVolume(
      basicResult.longtails.slice(0, 10) // 상위 10개만 검색량 조회
    )
    
    return {
      ...basicResult,
      longtails: [
        ...enrichedLongtails,
        ...basicResult.longtails.slice(10),
      ],
    }
  }

  /**
   * 검색량 정보 추가
   */
  private async enrichWithSearchVolume(
    keywords: Array<{ keyword: string; type: string }>
  ) {
    const enrichedKeywords = []
    
    for (const kw of keywords) {
      try {
        const keywordData = await naverApi.getKeywordData(kw.keyword)
        
        if (keywordData) {
          enrichedKeywords.push({
            ...kw,
            searchVolume: naverApi.calculateTotalVolume(keywordData),
            competition: keywordData.compIdx,
            score: naverApi.calculateCompetitionScore(keywordData),
          })
        } else {
          enrichedKeywords.push(kw)
        }
      } catch (error) {
        console.error(`검색량 조회 실패: ${kw.keyword}`)
        enrichedKeywords.push(kw)
      }
      
      // Rate limiting을 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    return enrichedKeywords
  }

  /**
   * 중복 제거
   */
  private removeDuplicates(keywords: LongtailKeyword[]): LongtailKeyword[] {
    const seen = new Set<string>()
    return keywords.filter(kw => {
      const normalized = kw.keyword.trim().toLowerCase()
      if (seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })
  }
}

// 싱글톤 인스턴스
export const longtailGenerator = new LongtailGenerator()