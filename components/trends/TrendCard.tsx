import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  subtitle?: string;
  color?: string;
}

export default function TrendCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  subtitle,
  color = 'bg-blue-500'
}: TrendCardProps) {
  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-gray-400" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end">
          <div className={`p-3 rounded-lg ${color}`}>
            {getTrendIcon()}
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${getChangeColor()}`}>
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}