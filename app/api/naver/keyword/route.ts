import { NextRequest, NextResponse } from 'next/server'
import { naverApi } from '@/lib/services/naverApi'
import { z } from 'zod'

// 요청 스키마 검증
const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    
    // 입력 검증
    const { keyword } = requestSchema.parse(body)
    
    // 키워드 데이터 조회
    const keywordData = await naverApi.getKeywordData(keyword)
    
    if (!keywordData) {
      return NextResponse.json(
        { success: false, error: '키워드 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    // 응답 데이터 가공
    const response = {
      keyword: keywordData.relKeyword,
      searchVolume: naverApi.calculateTotalVolume(keywordData),
      pcVolume: keywordData.monthlyPcQcCnt || 0,
      mobileVolume: keywordData.monthlyMobileQcCnt || 0,
      competition: keywordData.compIdx,
      cpc: keywordData.avgCpc || 0,
      score: naverApi.calculateCompetitionScore(keywordData),
    }
    
    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('API 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}