import { Filter, SortAsc, Download } from 'lucide-react';

interface FilterBarProps {
  filter: string;
  sortBy: string;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
  onExportCsv?: () => void;
}

export default function FilterBar({ 
  filter, 
  sortBy, 
  onFilterChange, 
  onSortChange, 
  onExportCsv 
}: FilterBarProps) {
  const filters = [
    { value: 'all', label: '전체' },
    { value: 'rising', label: '급상승' },
    { value: 'stable', label: '안정적' },
    { value: 'longtail', label: '롱테일' },
    { value: 'lowCompetition', label: '낮은 경쟁도' }
  ];

  const sortOptions = [
    { value: 'totalScore', label: '종합점수' },
    { value: 'naverVolume', label: '검색량' },
    { value: 'cpc', label: 'CPC' },
    { value: 'createdAt', label: '최신순' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => onFilterChange(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SortAsc className="h-5 w-5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {onExportCsv && (
            <button 
              onClick={onExportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              CSV 내보내기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}