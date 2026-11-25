import { getPriceHistory, monthlyCost, parseISODate, startOfToday, type Subscription } from './subscriptions'

export type PriceChange = {
  id: string
  name: string
  color: string
  date: Date
  from: number
  to: number
  pct: number
  monthlyDiff: number
}

export type MonthPoint = {
  key: string
  label: string
  total: number
  increases: number
}

const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'short' })
const monthLong = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

export function formatMonthLong(date: Date) {
  return monthLong.format(date)
}

function priceAt(sub: Subscription, date: Date) {
  let price: number | null = null
  for (const point of getPriceHistory(sub)) {
    if (parseISODate(point.date) <= date) price = point.price
  }
  return price
}

export function getPriceChanges(subs: Subscription[]): PriceChange[] {
  const changes: PriceChange[] = []
  for (const sub of subs) {
    const history = getPriceHistory(sub)
    for (let i = 1; i < history.length; i++) {
      const from = history[i - 1].price
      const to = history[i].price
      if (from === to) continue
      changes.push({
        id: `${sub.id}-${history[i].date}`,
        name: sub.name,
        color: sub.color,
        date: parseISODate(history[i].date),
        from,
        to,
        pct: from > 0 ? ((to - from) / from) * 100 : 0,
        monthlyDiff: monthlyCost({ ...sub, price: to }) - monthlyCost({ ...sub, price: from }),
      })
    }
  }
  return changes.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function getMonthlySeries(
  subs: Subscription[],
  changes: PriceChange[],
  { months = 12, includePaused = false }: { months?: number; includePaused?: boolean } = {},
): MonthPoint[] {
  const today = startOfToday()
  const active = includePaused ? subs : subs.filter((s) => !s.paused)
  const points: MonthPoint[] = []

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthEnd = i === 0 ? today : new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    const total = active.reduce((sum, sub) => {
      const price = priceAt(sub, monthEnd)
      return price === null ? sum : sum + monthlyCost({ ...sub, price })
    }, 0)
    const increases = changes.filter(
      (c) => c.to > c.from && c.date >= monthStart && c.date <= monthEnd,
    ).length
    points.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: monthLabel.format(monthStart).replace('.', ''),
      total: Math.round(total),
      increases,
    })
  }
  return points
}
