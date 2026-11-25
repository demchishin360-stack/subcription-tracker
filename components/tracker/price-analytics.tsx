'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Flame, TrendingUp } from 'lucide-react'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { formatMonthLong, getMonthlySeries, getPriceChanges, type MonthPoint } from '@/lib/analytics'
import { formatMoney, getPriceHistory, startOfToday, type Currency, type Subscription } from '@/lib/subscriptions'

const chartConfig = {
  total: { label: 'В месяц', color: 'var(--primary)' },
} satisfies ChartConfig

type DotProps = { cx?: number; cy?: number; payload?: MonthPoint }

function IncreaseDot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined || !payload?.increases) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill="var(--destructive)" opacity={0.25} />
      <circle cx={cx} cy={cy} r={4} fill="var(--destructive)" stroke="var(--background)" strokeWidth={2} />
    </g>
  )
}

const ALL = 'all'

export function PriceAnalytics({ subscriptions, currency }: { subscriptions: Subscription[]; currency: Currency }) {
  const [selectedId, setSelectedId] = useState<string>(ALL)
  const selected = subscriptions.find((s) => s.id === selectedId)
  const scope = selected ? [selected] : subscriptions

  const changeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const sub of subscriptions) {
      const history = getPriceHistory(sub)
      let n = 0
      for (let i = 1; i < history.length; i++) if (history[i].price !== history[i - 1].price) n++
      counts.set(sub.id, n)
    }
    return counts
  }, [subscriptions])

  const { series, changes, yearChanges, stats } = useMemo(() => {
    const changes = getPriceChanges(scope)
    const series = getMonthlySeries(scope, changes, { includePaused: Boolean(selected) })
    const today = startOfToday()
    const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    const yearChanges = changes.filter((c) => c.date >= yearAgo)
    const increases = yearChanges.filter((c) => c.to > c.from)
    const growth = yearChanges.reduce((sum, c) => sum + c.monthlyDiff, 0)
    const first = series.find((p) => p.total > 0)?.total ?? 0
    const last = series.at(-1)?.total ?? 0
    const biggest = [...increases].sort((a, b) => b.pct - a.pct)[0]

    const byMonth = new Map<string, { date: Date; diff: number }>()
    for (const c of increases) {
      const key = `${c.date.getFullYear()}-${c.date.getMonth()}`
      const entry = byMonth.get(key) ?? { date: c.date, diff: 0 }
      entry.diff += c.monthlyDiff
      byMonth.set(key, entry)
    }
    const hottestMonth = [...byMonth.values()].sort((a, b) => b.diff - a.diff)[0]

    return {
      series,
      changes,
      yearChanges,
      stats: {
        growth,
        growthPct: first > 0 ? ((last - first) / first) * 100 : 0,
        increases: increases.length,
        biggest,
        hottestMonth,
      },
    }
    // scope is derived from subscriptions + selected, which are the real inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, selected])

  const hasHistory = changes.length > 0
  const sortedSubs = [...subscriptions].sort(
    (a, b) => (changeCounts.get(b.id) ?? 0) - (changeCounts.get(a.id) ?? 0) || a.name.localeCompare(b.name),
  )

  return (
    <section aria-labelledby="analytics-title" className="glow-card flex flex-col gap-5 rounded-xl border bg-card p-4 md:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="analytics-title" className="font-semibold">
            Аналитика цен
          </h2>
          <p className="text-sm text-muted-foreground">
            {selected
              ? `Как менялась цена ${selected.name} за последние 12 месяцев`
              : 'Как менялись ваши расходы за последние 12 месяцев'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block size-2.5 rounded-full bg-destructive" aria-hidden="true" />
          месяц с подорожанием
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Подписка для аналитики"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
      >
        <PickerChip active={!selected} onClick={() => setSelectedId(ALL)} label="Все подписки" />
        {sortedSubs.map((sub) => (
          <PickerChip
            key={sub.id}
            active={selected?.id === sub.id}
            onClick={() => setSelectedId(sub.id)}
            label={sub.name}
            color={sub.color}
            count={changeCounts.get(sub.id) ?? 0}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={TrendingUp}
          label="Рост за год"
          value={`${stats.growth >= 0 ? '+' : '−'}${formatMoney(Math.abs(Math.round(stats.growth)), currency)}`}
          hint={`${stats.growthPct >= 0 ? '+' : ''}${stats.growthPct.toFixed(0)}% к расходам в месяц`}
          accent={stats.growth > 0}
        />
        <Metric
          icon={ArrowUpRight}
          label="Подорожаний"
          value={String(stats.increases)}
          hint={`всего изменений: ${yearChanges.length}`}
        />
        <Metric
          icon={Flame}
          label="Сильнее всего"
          value={stats.biggest ? `+${stats.biggest.pct.toFixed(0)}%` : '—'}
          hint={stats.biggest ? `${stats.biggest.name} · ${formatMonthLong(stats.biggest.date)}` : 'нет подорожаний'}
          accent={Boolean(stats.biggest)}
        />
        <Metric
          icon={ArrowUpRight}
          label="Худший месяц"
          value={stats.hottestMonth ? capitalize(formatMonthLong(stats.hottestMonth.date)) : '—'}
          hint={
            stats.hottestMonth
              ? `+${formatMoney(Math.round(stats.hottestMonth.diff), currency)} к расходам`
              : 'цены не росли'
          }
          small
        />
      </div>

      <ChartContainer config={chartConfig} className="chart-glow aspect-auto h-56 w-full md:h-64">
        <AreaChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fill-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-total)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-total)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            width={56}
            domain={[(min: number) => Math.max(0, Math.floor((min * 0.85) / 500) * 500), "auto"]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}к` : String(v))}
          />
          <ChartTooltip
            cursor={{ stroke: 'var(--color-total)', strokeOpacity: 0.4 }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as MonthPoint | undefined
              if (!active || !point) return null
              return (
                <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-xl">
                  <p className="font-medium capitalize">{point.label}</p>
                  <p className="tabular-nums text-primary">{formatMoney(point.total, currency)} / мес</p>
                  {point.increases > 0 && (
                    <p className="text-destructive">Подорожаний: {point.increases}</p>
                  )}
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--color-total)"
            strokeWidth={2.5}
            fill="url(#fill-total)"
            dot={<IncreaseDot />}
            activeDot={{ r: 5, fill: 'var(--color-total)', stroke: 'var(--background)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">История изменений</h3>
        {hasHistory ? (
          <ul className="flex flex-col divide-y rounded-xl border">
            {changes.slice(0, 8).map((c) => {
              const up = c.to > c.from
              return (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: c.color }}
                    aria-hidden="true"
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{capitalize(formatMonthLong(c.date))}</p>
                  </div>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    <span className="line-through">{formatMoney(c.from, currency)}</span>
                    {' → '}
                    <span className="font-medium text-foreground">{formatMoney(c.to, currency)}</span>
                  </p>
                  <span
                    className={`inline-flex min-w-16 items-center justify-end gap-0.5 text-sm font-semibold tabular-nums ${
                      up ? 'text-destructive' : 'text-primary'
                    }`}
                  >
                    {up ? (
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    ) : (
                      <ArrowDownRight className="size-4" aria-hidden="true" />
                    )}
                    {up ? '+' : ''}
                    {c.pct.toFixed(0)}%
                    <span className="sr-only">{up ? 'подорожание' : 'подешевение'}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Пока нет изменений цен. Когда вы поменяете цену подписки, изменение появится здесь.
          </p>
        )}
      </div>
    </section>
  )
}

function PickerChip({
  active,
  onClick,
  label,
  color,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
  count?: number
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
        active
          ? 'glow-primary border-primary bg-primary text-primary-foreground'
          : 'bg-background/40 text-muted-foreground hover:border-primary/50 hover:text-foreground'
      }`}
    >
      {color && (
        <span className="size-2.5 rounded-full ring-1 ring-background/40" style={{ backgroundColor: color }} aria-hidden="true" />
      )}
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`rounded-full px-1.5 text-xs tabular-nums ${
            active ? 'bg-primary-foreground/15' : 'bg-muted text-foreground'
          }`}
        >
          {count}
          <span className="sr-only"> изменений цены</span>
        </span>
      )}
    </button>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  small,
}: {
  icon: typeof TrendingUp
  label: string
  value: string
  hint: string
  accent?: boolean
  small?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border bg-background/40 p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <p
        className={`truncate font-semibold tabular-nums tracking-tight ${small ? 'text-base md:text-lg' : 'text-lg md:text-xl'} ${
          accent ? 'text-destructive' : ''
        }`}
      >
        {value}
      </p>
      <p className="truncate text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
