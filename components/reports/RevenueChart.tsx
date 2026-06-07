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
import { cardStyle, colors } from '@/lib/theme';

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
      title={<Text style={{ color: colors.text, fontWeight: 600 }}>Ingresos Diarios</Text>}
      style={cardStyle}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#db2777" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#db2777" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.divider} />
          <XAxis
            dataKey="date"
            tick={{ fill: colors.textMuted, fontSize: 11 }}
            axisLine={{ stroke: colors.cardBorder }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: colors.textMuted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `s/.${v}`}
          />
          <Tooltip
            contentStyle={{
              background: colors.contentBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 8,
              color: colors.text,
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
