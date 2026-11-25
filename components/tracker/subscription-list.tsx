'use client'

import { useMemo, useState } from 'react'
import { Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CYCLE_LABELS,
  CYCLE_SHORT,
  daysUntil,
  formatDate,
  formatMoney,
  monthlyCost,
  relativeDays,
  type Currency,
  type Subscription,
} from '@/lib/subscriptions'
import type { SubscriptionWithNext } from './subscription-tracker'

type SortKey = 'next' | 'price' | 'name'

type Props = {
  items: SubscriptionWithNext[]
  currency: Currency
  onEdit: (s: Subscription) => void
  onDelete: (s: Subscription) => void
  onTogglePause: (s: Subscription) => void
}

export function SubscriptionList({ items, currency, onEdit, onDelete, onTogglePause }: Props) {
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('next')

  const categories = useMemo(() => Array.from(new Set(items.map((s) => s.category))), [items])
  const activeCategory = category === 'all' || categories.includes(category) ? category : 'all'

  const visible = useMemo(() => {
    const filtered = activeCategory === 'all' ? items : items.filter((s) => s.category === activeCategory)
    return [...filtered].sort((a, b) => {
      if (a.paused !== b.paused) return a.paused ? 1 : -1
      if (sort === 'price') return monthlyCost(b) - monthlyCost(a)
      if (sort === 'name') return a.name.localeCompare(b.name, 'ru')
      return a.next.getTime() - b.next.getTime()
    })
  }, [items, activeCategory, sort])

  return (
    <section aria-labelledby="list-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="list-title" className="text-lg font-semibold">
          Мои подписки <span className="font-normal text-muted-foreground">({items.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-muted-foreground">
            Сортировка
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="next">По дате списания</option>
            <option value="price">По стоимости</option>
            <option value="name">По названию</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Фильтр по категориям">
        {['all', ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={activeCategory === c}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              activeCategory === c
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {c === 'all' ? 'Все' : c}
          </button>
        ))}
      </div>

      <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
        {visible.map((s) => {
          const days = daysUntil(s.next)
          return (
            <li key={s.id} className={cn('flex items-center gap-3 p-4', s.paused && 'opacity-60')}>
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              >
                {s.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{s.name}</span>
                  {s.paused && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      На паузе
                    </span>
                  )}
                </div>
                <span className="truncate text-sm text-muted-foreground">
                  {s.category} · {CYCLE_LABELS[s.cycle]}
                  {!s.paused && (
                    <>
                      {' · '}
                      <span className={cn(days <= 3 && 'font-medium text-primary')}>
                        {relativeDays(days)}, {formatDate(s.next)}
                      </span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex shrink-0 flex-col items-end">
                <span className="font-semibold tabular-nums">
                  {formatMoney(s.price, currency)}
                  <span className="text-sm font-normal text-muted-foreground">/{CYCLE_SHORT[s.cycle]}</span>
                </span>
                {s.cycle !== 'monthly' && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ≈ {formatMoney(Math.round(monthlyCost(s)), currency)}/мес
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center">
                <IconButton label={s.paused ? `Возобновить ${s.name}` : `Поставить ${s.name} на паузу`} onClick={() => onTogglePause(s)}>
                  {s.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                </IconButton>
                <IconButton label={`Редактировать ${s.name}`} onClick={() => onEdit(s)}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton label={`Удалить ${s.name}`} onClick={() => onDelete(s)} destructive>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function IconButton({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2',
        destructive && 'hover:text-destructive',
      )}
    >
      {children}
    </button>
  )
}
