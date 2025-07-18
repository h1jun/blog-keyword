'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Search, Target, DollarSign } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function StatsOverview() {
  const [stats, setStats] = useState({
    totalKeywords: 0,
    risingKeywords: 0,
    lowCompetition: 0,
    averageCpc: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="총 키워드"
        value={stats.totalKeywords.toLocaleString()}
        change="+12%"
        icon={<Search className="h-6 w-6 text-white" />}
        color="bg-blue-500"
      />
      <StatCard
        title="급상승 키워드"
        value={stats.risingKeywords.toLocaleString()}
        change="+34%"
        icon={<TrendingUp className="h-6 w-6 text-white" />}
        color="bg-green-500"
      />
      <StatCard
        title="낮은 경쟁도"
        value={stats.lowCompetition.toLocaleString()}
        icon={<Target className="h-6 w-6 text-white" />}
        color="bg-purple-500"
      />
      <StatCard
        title="평균 CPC"
        value={`₩${stats.averageCpc.toLocaleString()}`}
        change="-5%"
        icon={<DollarSign className="h-6 w-6 text-white" />}
        color="bg-orange-500"
      />
    </div>
  );
}