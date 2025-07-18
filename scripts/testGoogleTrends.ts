import dotenv from 'dotenv';
import { GoogleTrendsService } from '../lib/services/googleTrends';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

async function testSerpApiTrends() {
  console.log('=== SerpAPI Google Trends 테스트 시작 ===\n');

  // 서비스 인스턴스 생성
  const googleTrendsService = new GoogleTrendsService();

  try {
    // 1. 일일 트렌드 테스트
    console.log('1. 일일 트렌드 수집 테스트');
    const dailyTrends = await googleTrendsService.getDailyTrends();
    console.log(`- 수집된 트렌드 수: ${dailyTrends.trends.length}`);
    console.log(`- 상위 3개 트렌드:`);
    dailyTrends.trends.slice(0, 3).forEach((trend, i) => {
      console.log(`  ${i + 1}. ${trend.query} (${trend.traffic || 'N/A'})`);
    });

    // 2. 특정 키워드 트렌드 테스트
    console.log('\n3. 키워드 트렌드 테스트');
    const keyword = '챗GPT';
    const interestData = await googleTrendsService.getInterestOverTime(keyword, '7d');
    console.log(`- "${keyword}" 관심도 데이터 포인트: ${interestData.data.length}개`);

    // 3. 연관 검색어 테스트
    console.log('\n4. 연관 검색어 테스트');
    const relatedQueries = await googleTrendsService.getRelatedQueries(keyword);
    console.log(`- "${keyword}" 연관 검색어: ${relatedQueries.length}개`);
    console.log(`- 상위 5개:`, relatedQueries.slice(0, 5));

    console.log('\n=== 테스트 완료 ===');

  } catch (error) {
    console.error('테스트 실패:', error);
    console.error('SERPAPI_KEY 환경 변수가 설정되었는지 확인하세요.');
  }
}

// 테스트 실행
testSerpApiTrends();