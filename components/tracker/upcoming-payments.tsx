import { daysUntil, formatDate, formatMoney, relativeDays, type Currency } from '@/lib/subscriptions'
import type { SubscriptionWithNext } from './subscription-tracker'

export function UpcomingPayments({ items, currency }: { items: SubscriptionWithNext[]; currency: Currency }) {
  const upcoming = items
    .filter((s) => !s.paused && daysUntil(s.next) <= 30)
    .sort((a, b) => a.next.getTime() - b.next.getTime())
  const total = upcoming.reduce((sum, s) => sum + s.price, 0)

  return (
    <section aria-labelledby="upcoming-title" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="upcoming-title" className="font-semibold">
          Ближайшие 30 дней
        </h2>
        <span className="text-sm font-medium tabular-nums">{formatMoney(total, currency)}</span>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">Списаний не ожидается.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {upcoming.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <div className="flex w-10 shrink-0 flex-col items-center rounded-md bg-muted py-1 leading-none">
                <span className="text-sm font-semibold tabular-nums">{s.next.getDate()}</span>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {s.next.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {relativeDays(daysUntil(s.next))}
                  <span className="sr-only">, {formatDate(s.next)}</span>
                </span>
              </div>
              <span className="text-sm tabular-nums">{formatMoney(s.price, currency)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
