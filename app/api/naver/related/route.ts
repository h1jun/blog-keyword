import { NextRequest, NextResponse } from 'next/server'
import { naverApi } from '@/lib/services/naverApi'
import { z } from 'zod'

const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, limit = 10 } = requestSchema.parse(body)
    
    // 연관 키워드 조회
    const relatedKeywords = await naverApi.getRelatedKeywords(keyword, limit)
    
    // 데이터 가공
    const processedKeywords = relatedKeywords.map(data => ({
      keyword: data.relKeyword,
      searchVolume: naverApi.calculateTotalVolume(data),
      competition: data.compIdx,
      score: naverApi.calculateCompetitionScore(data),
    }))
    
    return NextResponse.json({
      success: true,
      data: processedKeywords,
    })
  } catch (error) {
    console.error('API 오류:', error)
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}