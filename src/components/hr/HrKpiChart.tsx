"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface KpiData {
  department: string;
  score: number;
}

const DEFAULT_DATA: KpiData[] = [
  { department: "Guru SD", score: 88 },
  { department: "Guru SMP", score: 92 },
  { department: "Guru TK/PS", score: 85 },
  { department: "Staf Admin", score: 90 },
  { department: "Operasional", score: 82 },
];

export function HrKpiChart({ data = DEFAULT_DATA }: { data?: KpiData[] }) {
  const chartData = data && data.length > 0 ? data : DEFAULT_DATA;

  return (
    <div className="h-[260px] sm:h-[280px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="department" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }} 
            dy={8}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }} 
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip 
            cursor={{ fill: '#F8FAFC', opacity: 0.8 }}
            contentStyle={{ 
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '8px 12px'
            }}
            formatter={(value: any) => [`${value} Poin`, "Skor KPI"]}
            labelStyle={{ color: '#94A3B8', marginBottom: '2px', fontSize: '11px' }}
          />
          <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={36}>
            {chartData.map((entry, index) => {
              // Color based on performance tier
              const color = 
                entry.score >= 90 ? "#10B981" : // Emerald
                entry.score >= 80 ? "#0284C7" : // Sky
                entry.score >= 70 ? "#F59E0B" : // Amber
                "#EF4444"; // Rose
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
