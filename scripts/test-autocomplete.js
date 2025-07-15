// 자동완성 기능 테스트 스크립트
const testKeywords = [
  '블로그',
  '캠핑',
  '챗GPT',
  '부동산',
  'React',
]

async function testAutoComplete() {
  console.log('🧪 자동완성 테스트 시작...\n')
  
  for (const keyword of testKeywords) {
    console.log(`\n📌 테스트 키워드: "${keyword}"`)
    
    try {
      const response = await fetch('http://localhost:3000/api/longtail/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          includeVolume: false,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ 성공: ${data.data.totalCount}개 생성`)
        console.log(`   소스: ${data.data.source}`)
        console.log(`   샘플:`, data.data.longtails.slice(0, 3).map(lt => lt.keyword))
      } else {
        console.log(`❌ 실패:`, data.error)
      }
    } catch (error) {
      console.log(`❌ 오류:`, error.message)
    }
    
    // Rate limiting 방지
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n✨ 테스트 완료!')
}

// 실행
testAutoComplete()