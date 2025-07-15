'use client'

import { useState } from 'react'

interface LongtailData {
  keyword: string
  type: string
  searchVolume?: number
  competition?: string
  score?: number
}

export default function TestLongtail() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [longtails, setLongtails] = useState<LongtailData[]>([])
  const [includeVolume, setIncludeVolume] = useState(false)
  const [source, setSource] = useState<string>('')

  const generateLongtails = async () => {
    if (!keyword.trim()) return

    setLoading(true)
    setLongtails([])

    try {
      const response = await fetch('/api/longtail/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          includeVolume,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setLongtails(data.data.longtails)
        setSource(data.data.source)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'autocomplete':
        return 'bg-blue-100 text-blue-800'
      case 'related':
        return 'bg-green-100 text-green-800'
      case 'pattern':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">롱테일 키워드 생성 테스트</h1>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateLongtails()}
            placeholder="시드 키워드를 입력하세요"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={generateLongtails}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '생성 중...' : '생성'}
          </button>
        </div>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeVolume}
            onChange={(e) => setIncludeVolume(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">검색량 데이터 포함 (느림)</span>
        </label>
      </div>

      {source && (
        <div className="mb-4 text-sm text-gray-600">
          데이터 소스: {source === 'api' ? '네이버 자동완성' : '폴백 패턴'}
        </div>
      )}

      {longtails.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold mb-3">
            생성된 롱테일 키워드 ({longtails.length}개)
          </h2>
          {longtails.map((lt, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">
                  #{index + 1}
                </span>
                <span className="font-medium">{lt.keyword}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getTypeColor(
                    lt.type
                  )}`}
                >
                  {lt.type}
                </span>
              </div>
              
              {includeVolume && lt.searchVolume !== undefined && (
                <div className="flex items-center gap-4 text-sm">
                  <span>검색량: {lt.searchVolume.toLocaleString()}</span>
                  {lt.competition && (
                    <span>경쟁도: {lt.competition}</span>
                  )}
                  {lt.score !== undefined && (
                    <span>점수: {lt.score}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}