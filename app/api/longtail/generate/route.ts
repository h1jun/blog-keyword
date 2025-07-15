import { NextRequest, NextResponse } from 'next/server'
import { longtailGenerator } from '@/lib/services/longtailGenerator'
import { z } from 'zod'

const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
  includeVolume: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, includeVolume } = requestSchema.parse(body)
    
    // 롱테일 키워드 생성
    const result = includeVolume
      ? await longtailGenerator.generateWithVolume(keyword)
      : await longtailGenerator.generateSimple(keyword)
    
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('롱테일 생성 오류:', error)
    
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