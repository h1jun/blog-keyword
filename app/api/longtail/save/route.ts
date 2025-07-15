import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const requestSchema = z.object({
  parentKeyword: z.string(),
  longtails: z.array(z.object({
    keyword: z.string(),
    type: z.enum(['autocomplete', 'related', 'pattern']),
  })),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { parentKeyword, longtails } = requestSchema.parse(body)
    
    // 데이터 변환
    const dataToInsert = longtails.map(lt => ({
      parent_keyword: parentKeyword,
      longtail_keyword: lt.keyword,
      source: lt.type,
    }))
    
    // 일괄 저장
    const { data, error } = await supabase
      .from('longtail_keywords')
      .upsert(dataToInsert, {
        onConflict: 'longtail_keyword',
        ignoreDuplicates: true,
      })
      .select()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data: {
        saved: data?.length || 0,
        total: longtails.length,
      },
    })
  } catch (error) {
    console.error('저장 오류:', error)
    
    return NextResponse.json(
      { success: false, error: '저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}