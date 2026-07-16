import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SeriesPoint } from '../../lib/types'

interface MetricLineChartProps {
  data: SeriesPoint[]
  color?: string
  unit?: string
  xLabel?: string
  height?: number
}

export function MetricLineChart({
  data,
  color = 'var(--color-teal)',
  unit = '',
  xLabel = 's',
  height = 220,
}: MetricLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <XAxis
          dataKey="t"
          tickFormatter={(t: number) => `${t}${xLabel}`}
          tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
          axisLine={{ stroke: 'var(--color-ink-soft)', opacity: 0.2 }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(value) => [`${value ?? ''}${unit}`, '']}
          labelFormatter={(label) => `${String(label)}${xLabel}`}
          contentStyle={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid rgba(22,48,46,0.1)',
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
