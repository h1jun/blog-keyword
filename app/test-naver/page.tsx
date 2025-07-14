'use client'

import { useState } from 'react'

interface KeywordResult {
  keyword: string
  searchVolume: number
  pcVolume: number
  mobileVolume: number
  competition: string
  cpc: number
  score: number
}

export default function TestNaver() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KeywordResult | null>(null)
  const [error, setError] = useState('')

  const searchKeyword = async () => {
    if (!keyword.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/naver/keyword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim() }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || '오류가 발생했습니다.')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">네이버 API 테스트</h1>
      
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchKeyword()}
            placeholder="검색할 키워드를 입력하세요"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchKeyword}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{result.keyword}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">총 검색량</p>
              <p className="text-2xl font-bold">{result.searchVolume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">경쟁도</p>
              <p className="text-2xl font-bold">
                {result.competition === '낮음' && '🟢'} 
                {result.competition === '중간' && '🟡'} 
                {result.competition === '높음' && '🔴'} 
                {result.competition}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PC 검색량</p>
              <p className="text-lg">{result.pcVolume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">모바일 검색량</p>
              <p className="text-lg">{result.mobileVolume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">평균 CPC</p>
              <p className="text-lg">₩{result.cpc.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">점수</p>
              <p className="text-lg">{result.score}점</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}