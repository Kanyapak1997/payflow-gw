import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { volumeSeries, type RangeKey, type VolumePoint } from '@/lib/analytics'
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/format'

interface TooltipItem {
  value?: number | string
  payload?: VolumePoint
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="bg-popover shadow-pop min-w-44 rounded-lg border p-3">
      <p className="text-muted-foreground text-[11.5px] font-medium">
        {format(parseISO(point.date), 'EEEE, d MMM yyyy')}
      </p>
      <p className="tabular mt-1.5 text-[17px] leading-none font-semibold">
        {formatCurrency(point.volume, 'THB', { decimals: false })}
      </p>
      <div className="text-muted-foreground mt-2 space-y-0.5 text-[12px]">
        <p className="flex items-center justify-between gap-6">
          <span>Transactions</span>
          <span className="tabular text-foreground font-medium">
            {formatNumber(point.transactions)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-6">
          <span>Refunded</span>
          <span className="tabular text-foreground font-medium">
            {formatCurrency(point.refunds, 'THB', { decimals: false })}
          </span>
        </p>
      </div>
    </div>
  )
}

function VolumeChart({ range }: { range: RangeKey }) {
  const data = useMemo(() => volumeSeries(range), [range])
  // Thin out labels on the longer windows so the axis never collides.
  const tickInterval = range === '7d' ? 0 : range === '30d' ? 4 : 14

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 14, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 3"
            strokeOpacity={0.9}
          />
          <XAxis
            dataKey="label"
            interval={tickInterval}
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11.5 }}
          />
          <YAxis
            width={62}
            tickLine={false}
            axisLine={false}
            tickCount={5}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11.5 }}
            tickFormatter={(value: number) => formatCompactCurrency(value)}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: 'var(--chart-1)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="volume"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#volumeFill)"
            activeDot={{
              r: 4,
              strokeWidth: 2,
              stroke: 'var(--background)',
              fill: 'var(--chart-1)',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Default export so the dashboard can pull the chart (and Recharts with it)
// in as its own chunk via React.lazy.
export default VolumeChart
export { VolumeChart }
