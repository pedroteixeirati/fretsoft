import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const data = [
  { name: 'HV-102', value: 12400, color: '#526600' },
  { name: 'MD-045', value: 9100, color: '#8ca33e' },
  { name: 'LV-201', value: 7800, color: '#8ca33e' },
  { name: 'HV-109', value: 5200, color: '#dee2c9' },
  { name: 'XT-991', value: 10900, color: '#c581ce' },
];

export default function ExpendituresChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e3d8" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#454839' }}
          />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-on-surface text-surface px-3 py-1 rounded-lg text-[10px] font-bold">
                    ${payload[0].value.toLocaleString()}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
