import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // 데이터베이스 연결 확인
    const { data: dbHealth, error: dbError } = await supabase
      .from('keywords')
      .select('count(*)')
      .limit(1);
    
    // 환경 변수 확인
    const envCheck = {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      naver: !!process.env.NAVER_API_KEY,
      serpapi: !!process.env.SERPAPI_KEY,
    };
    
    // 최근 데이터 수집 확인
    const { data: recentData } = await supabase
      .from('keywords')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    
    const lastCollection = recentData?.[0]?.created_at;
    const timeSinceLastCollection = lastCollection ? 
      Date.now() - new Date(lastCollection).getTime() : null;
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: !dbError,
        error: dbError?.message || null
      },
      environment: envCheck,
      lastCollection: {
        timestamp: lastCollection,
        timeSinceMs: timeSinceLastCollection,
        isRecent: timeSinceLastCollection ? timeSinceLastCollection < 24 * 60 * 60 * 1000 : false
      },
      responseTime: Date.now() - startTime
    };
    
    // 전체 상태 판정
    const isHealthy = !dbError && 
      Object.values(envCheck).every(v => v) &&
      (health.lastCollection.isRecent || !lastCollection);
    
    return NextResponse.json(health, { 
      status: isHealthy ? 200 : 503 
    });
    
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}