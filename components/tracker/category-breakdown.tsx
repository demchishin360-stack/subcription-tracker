import { formatMoney, monthlyCost, type Currency } from '@/lib/subscriptions'
import type { SubscriptionWithNext } from './subscription-tracker'

export function CategoryBreakdown({ items, currency }: { items: SubscriptionWithNext[]; currency: Currency }) {
  const totals = new Map<string, number>()
  for (const s of items) {
    if (s.paused) continue
    totals.set(s.category, (totals.get(s.category) ?? 0) + monthlyCost(s))
  }
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const sum = rows.reduce((acc, [, v]) => acc + v, 0)

  return (
    <section aria-labelledby="categories-title" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id="categories-title" className="font-semibold">
        По категориям <span className="text-sm font-normal text-muted-foreground">в месяц</span>
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет активных подписок.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(([category, value]) => {
            const percent = sum > 0 ? Math.round((value / sum) * 100) : 0
            return (
              <li key={category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{category}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(Math.round(value), currency)} · {percent}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
