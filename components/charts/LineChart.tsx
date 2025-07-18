'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  dataKey?: string;
  title?: string;
  color?: string;
  height?: number;
}

export default function CustomLineChart({ 
  data, 
  dataKey = 'value', 
  title,
  color = '#3B82F6',
  height = 300 
}: LineChartProps) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}