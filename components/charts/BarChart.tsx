'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartProps {
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

export default function CustomBarChart({ 
  data, 
  dataKey = 'value', 
  title,
  color = '#10B981',
  height = 300 
}: BarChartProps) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
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
          <Bar 
            dataKey={dataKey} 
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}