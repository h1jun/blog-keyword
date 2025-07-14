'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDB() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      // 테스트 데이터 삽입
      const { data, error } = await supabase
        .from('keywords')
        .insert({
          keyword: '테스트 키워드',
          search_volume: 1000,
          competition_level: '낮음',
          cpc: 500,
          score: 80,
          platform: 'naver'
        })
        .select()

      if (error) {
        setResult(`Error: ${error.message}`)
      } else {
        setResult(`Success: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setResult(`Error: ${err}`)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '테스트 중...' : 'DB 연결 테스트'}
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {result}
        </pre>
      )}
    </div>
  )
}