import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          블로그 키워드 자동 수집 시스템
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Google, 네이버, YouTube의 트렌드를 한 곳에서 확인하세요
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  )
}