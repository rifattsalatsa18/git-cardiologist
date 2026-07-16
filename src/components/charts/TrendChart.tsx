import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Recording } from '../../lib/types'

interface TrendChartProps {
  recordings: Recording[]
}

export function TrendChart({ recordings }: TrendChartProps) {
  const data = [...recordings]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((r) => ({
      date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      avgBpm: r.metrics.avgBpm,
    }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,48,46,0.08)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
          axisLine={{ stroke: 'var(--color-ink-soft)', opacity: 0.2 }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
          axisLine={false}
          tickLine={false}
          width={40}
          domain={['dataMin - 5', 'dataMax + 5']}
        />
        <Tooltip
          formatter={(value) => [`${value ?? ''} bpm`, 'Average heart rate']}
          contentStyle={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid rgba(22,48,46,0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="avgBpm"
          stroke="var(--color-teal)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-teal)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
