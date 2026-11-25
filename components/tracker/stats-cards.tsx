import { CalendarClock, Layers, TrendingUp, Wallet } from 'lucide-react'
import { daysUntil, formatDate, formatMoney, monthlyCost, relativeDays, type Currency } from '@/lib/subscriptions'
import type { SubscriptionWithNext } from './subscription-tracker'

export function StatsCards({ items, currency }: { items: SubscriptionWithNext[]; currency: Currency }) {
  const active = items.filter((s) => !s.paused)
  const monthly = active.reduce((sum, s) => sum + monthlyCost(s), 0)
  const nearest = [...active].sort((a, b) => a.next.getTime() - b.next.getTime())[0]

  const stats = [
    { label: 'В месяц', value: formatMoney(Math.round(monthly), currency), hint: 'с учётом всех периодов', icon: Wallet },
    { label: 'В год', value: formatMoney(Math.round(monthly * 12), currency), hint: 'прогноз расходов', icon: TrendingUp },
    {
      label: 'Активных',
      value: String(active.length),
      hint: items.length > active.length ? `ещё ${items.length - active.length} на паузе` : 'все подписки активны',
      icon: Layers,
    },
    {
      label: 'Ближайшее списание',
      value: nearest ? formatMoney(nearest.price, currency) : '—',
      hint: nearest ? `${nearest.name} · ${relativeDays(daysUntil(nearest.next)).toLowerCase()}, ${formatDate(nearest.next)}` : 'нет активных',
      icon: CalendarClock,
    },
  ]

  return (
    <section aria-label="Сводка" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, hint, icon: Icon }, index) => (
        <div
          key={label}
          className={`flex flex-col gap-2 rounded-xl border bg-card p-4 transition-shadow hover:glow-card ${
            index === 0 ? 'glow-card' : ''
          }`}
        >
          <div className={`flex items-center justify-between ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <p
            className={`text-xl font-semibold tabular-nums tracking-tight md:text-2xl ${
              index === 0 ? 'text-glow text-primary' : ''
            }`}
          >
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      ))}
    </section>
  )
}
