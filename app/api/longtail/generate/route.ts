import { NextRequest, NextResponse } from 'next/server'
import { longtailGenerator } from '@/lib/services/longtailGenerator'
import { supabase } from '@/lib/supabase'
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
    
    // Supabase에 저장
    const longtailData = result.longtails.map(longtail => ({
      parent_keyword: keyword,
      longtail_keyword: longtail.keyword,
      source: longtail.type,
      search_volume: longtail.searchVolume || null,
      competition_level: longtail.competition || null,
      score: longtail.score || null,
    }))
    
    if (longtailData.length > 0) {
      const { error } = await supabase
        .from('longtail_keywords')
        .upsert(longtailData, {
          onConflict: 'longtail_keyword',
          ignoreDuplicates: true,
        })
      
      if (error) {
        console.error('롱테일 키워드 저장 실패:', error)
        // 저장 실패해도 생성된 데이터는 반환
      }
    }
    
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