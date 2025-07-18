import { Crown, TrendingUp, Star } from 'lucide-react';

interface KeywordRankingProps {
  keywords: Array<{
    keyword: string;
    score: number;
    searchVolume: number;
    change?: number;
    rank: number;
  }>;
  title?: string;
  limit?: number;
}

export default function KeywordRanking({ 
  keywords, 
  title = "키워드 순위", 
  limit = 10 
}: KeywordRankingProps) {
  const limitedKeywords = keywords.slice(0, limit);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Star className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Star className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      
      <div className="space-y-3">
        {limitedKeywords.map((item, index) => (
          <div key={item.keyword} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(item.rank)}
              </div>
              
              <div>
                <p className="font-medium text-gray-900">{item.keyword}</p>
                <p className="text-sm text-gray-500">
                  {item.searchVolume.toLocaleString()} 검색량
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">{item.score}</span>
              {item.change !== undefined && (
                <div className={`flex items-center gap-1 ${
                  item.change > 0 ? 'text-green-600' : 
                  item.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${item.change < 0 ? 'rotate-180' : ''}`} />
                  <span className="text-sm">{Math.abs(item.change)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}