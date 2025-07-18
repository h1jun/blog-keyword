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
    } catch (error) {
      console.error('Error:', error)
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
            onKeyDown={(e) => e.key === 'Enter' && generateLongtails()}
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

      {/* 점수 계산 로직 설명 */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">점수 계산 로직 설명</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-2">기본 점수 (경쟁도 기준):</p>
            <ul className="ml-4 space-y-1">
              <li>• <span className="font-medium text-green-600">낮음</span>: 85점 (경쟁이 적어서 상위 노출이 쉬움)</li>
              <li>• <span className="font-medium text-yellow-600">중간</span>: 55점 (적당한 경쟁)</li>
              <li>• <span className="font-medium text-red-600">높음</span>: 25점 (경쟁이 치열해서 상위 노출 어려움)</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium mb-2">검색량 보정:</p>
            <ul className="ml-4 space-y-1">
              <li>• 100 미만: -10점 (검색량이 너무 적음)</li>
              <li>• 10,000 초과: +5점 (검색량이 많아서 가치 있음)</li>
            </ul>
          </div>
          
          <div className="pt-2 border-t">
            <p className="font-medium text-blue-600">결과 해석:</p>
            <ul className="ml-4 space-y-1">
              <li>• <span className="font-medium">높은 점수</span>: 경쟁 낮고 + 적절한 검색량 = 타겟하기 좋은 키워드</li>
              <li>• <span className="font-medium">낮은 점수</span>: 경쟁 높거나 검색량 부족 = 피해야 할 키워드</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}