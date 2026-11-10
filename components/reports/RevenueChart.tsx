'use client';

import { Card, Typography } from 'antd';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import { DashboardData } from '@/types/api';
import { cardStyle, colors } from '@/lib/theme';
import { FINANCIAL_LABELS } from '@/lib/financials';

const { Text } = Typography;

const NET_INCOME_COLOR = '#db2777';
const NET_EXPENSES_COLOR = '#ef4444';

interface RevenueChartProps {
  data: DashboardData;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.dailySeries.map((d) => ({
    date: dayjs(d.date).format('D MMM'),
    netIncome: d.netIncome,
    netExpenses: d.netExpenses,
  }));

  return (
    <Card
      title={
        <Text style={{ color: colors.text, fontWeight: 600 }}>
          Diario: {FINANCIAL_LABELS.netIncome} vs. {FINANCIAL_LABELS.netExpenses}
        </Text>
      }
      style={cardStyle}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netIncomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={NET_INCOME_COLOR} stopOpacity={0.25} />
              <stop offset="95%" stopColor={NET_INCOME_COLOR} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="netExpensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={NET_EXPENSES_COLOR} stopOpacity={0.2} />
              <stop offset="95%" stopColor={NET_EXPENSES_COLOR} stopOpacity={0} />
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
            formatter={(value, name) => [`s/. ${Number(value).toFixed(2)}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: colors.textMuted }} />
          <Area
            type="monotone"
            dataKey="netIncome"
            name={FINANCIAL_LABELS.netIncome}
            stroke={NET_INCOME_COLOR}
            strokeWidth={2}
            fill="url(#netIncomeGradient)"
            dot={false}
            activeDot={{ r: 4, fill: NET_INCOME_COLOR }}
          />
          <Area
            type="monotone"
            dataKey="netExpenses"
            name={FINANCIAL_LABELS.netExpenses}
            stroke={NET_EXPENSES_COLOR}
            strokeWidth={2}
            fill="url(#netExpensesGradient)"
            dot={false}
            activeDot={{ r: 4, fill: NET_EXPENSES_COLOR }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
