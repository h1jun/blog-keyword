/**
 * 키워드 품질 판단
 */
export function getKeywordQuality(
  searchVolume: number,
  competition: string
): 'excellent' | 'good' | 'average' | 'poor' {
  if (searchVolume >= 1000 && competition === '낮음') {
    return 'excellent'
  } else if (searchVolume >= 500 && competition !== '높음') {
    return 'good'
  } else if (searchVolume >= 100) {
    return 'average'
  }
  return 'poor'
}

/**
 * 추천 메시지 생성
 */
export function getRecommendationMessage(
  score: number
): string {
  if (score >= 80) {
    return '🎯 즉시 작성을 추천합니다!'
  } else if (score >= 60) {
    return '💡 좋은 기회입니다. 콘텐츠 품질에 집중하세요.'
  } else if (score >= 40) {
    return '🤔 신중히 검토해보세요. 롱테일 키워드를 고려하세요.'
  } else {
    return '⚠️ 다른 키워드를 찾아보는 것이 좋겠습니다.'
  }
}

/**
 * 검색량 포맷팅
 */
export function formatSearchVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`
  }
  return volume.toString()
}