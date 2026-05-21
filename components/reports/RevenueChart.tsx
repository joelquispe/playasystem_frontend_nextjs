'use client';

import { Card, Typography } from 'antd';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import { DashboardData } from '@/types/api';

const { Text } = Typography;

interface RevenueChartProps {
  data: DashboardData;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.dailySeries.map((d) => ({
    date: dayjs(d.date).format('D MMM'),
    revenue: d.revenue,
  }));

  return (
    <Card
      title={
        <Text style={{ color: '#e0e0e0', fontWeight: 600 }}>
          Ingresos Diarios
        </Text>
      }
      style={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 12 }}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#db2777" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#db2777" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#666', fontSize: 11 }}
            axisLine={{ stroke: '#2d2d2d' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `s/.${v}`}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 8,
              color: '#e0e0e0',
            }}
            formatter={(value) => [`s/. ${Number(value).toFixed(2)}`, 'Ingresos']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#db2777"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#db2777' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
