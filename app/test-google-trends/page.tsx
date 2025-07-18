'use client'

import { useState } from 'react'

interface TrendData {
  keyword: string
  search_volume: number
  competition_level: string
  score: number
  platform: string
  metadata?: {
    related_queries?: string[]
    traffic_formatted?: string
  }
}

export default function TestGoogleTrends() {
  const [loading, setLoading] = useState(false)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [keyword, setKeyword] = useState('')
  const [keywordResult, setKeywordResult] = useState<any>(null)

  const fetchTrends = async (type: 'daily') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/google/trends?type=${type}`)
      const data = await response.json()

      if (data.success) {
        setTrends(data.data)
        console.log('Google Trends 데이터:', data)
      } else {
        console.error('오류:', data.error)
      }
    } catch (error) {
      console.error('네트워크 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchKeyword = async () => {
    if (!keyword.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/google/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          timeframe: '7d'
        })
      })

      const data = await response.json()

      if (data.success) {
        setKeywordResult(data.data)
        console.log('키워드 결과:', data.data)
      } else {
        console.error('오류:', data.error)
      }
    } catch (error) {
      console.error('네트워크 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Google Trends 테스트</h1>

      {/* 트렌드 수집 버튼 */}
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => fetchTrends('daily')}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '로딩 중...' : '일일 트렌드 수집'}
          </button>
        </div>
      </div>

      {/* 키워드 검색 */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchKeyword()}
            placeholder="키워드 입력 (예: 챗GPT)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchKeyword}
            disabled={loading}
            className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
          >
            키워드 검색
          </button>
        </div>
      </div>

      {/* 키워드 결과 표시 */}
      {keywordResult && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">키워드 분석 결과</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">관심도 데이터</p>
              <p className="text-lg">{keywordResult.interest?.data?.length || 0}개 포인트</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">연관 검색어</p>
              <p className="text-lg">{keywordResult.related?.length || 0}개</p>
            </div>
          </div>
          {keywordResult.related && keywordResult.related.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">연관 검색어:</p>
              <div className="flex flex-wrap gap-2">
                {keywordResult.related.slice(0, 10).map((query: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {query}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 트렌드 결과 표시 */}
      {trends.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            수집된 트렌드 ({trends.length}개)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.slice(0, 20).map((trend, index) => (
              <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{trend.keyword}</h3>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>검색량:</span>
                    <span>{trend.search_volume?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>경쟁도:</span>
                    <span>
                      {trend.competition_level === '낮음' && '🟢'}
                      {trend.competition_level === '중간' && '🟡'}
                      {trend.competition_level === '높음' && '🔴'}
                      {trend.competition_level}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>점수:</span>
                    <span className="font-medium">{trend.score}</span>
                  </div>
                  {trend.metadata?.traffic_formatted && (
                    <div className="flex justify-between">
                      <span>트래픽:</span>
                      <span>{trend.metadata.traffic_formatted}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}