'use client'

import { useMemo, useState } from 'react'
import { Plus, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscriptions } from '@/lib/use-subscriptions'
import {
  CURRENCIES,
  getNextPayment,
  startOfToday,
  withPriceChange,
  type Currency,
  type Subscription,
} from '@/lib/subscriptions'
import { PriceAnalytics } from './price-analytics'
import { StatsCards } from './stats-cards'
import { SubscriptionList } from './subscription-list'
import { UpcomingPayments } from './upcoming-payments'
import { CategoryBreakdown } from './category-breakdown'
import { SubscriptionFormDialog } from './subscription-form-dialog'
import { EmptyState } from './empty-state'
import { BackupControls } from './backup-controls'

export type SubscriptionWithNext = Subscription & { next: Date }

export function SubscriptionTracker() {
  const store = useSubscriptions()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  const items = useMemo<SubscriptionWithNext[]>(() => {
    const today = startOfToday()
    return store.subscriptions.map((s) => ({ ...s, next: getNextPayment(s, today) }))
  }, [store.subscriptions])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (sub: Subscription) => {
    setEditing(sub)
    setDialogOpen(true)
  }

  const handleSubmit = (values: Omit<Subscription, 'id'>) => {
    if (editing) {
      const priceHistory =
        values.price !== editing.price ? withPriceChange(editing, values.price) : editing.priceHistory
      store.edit(editing.id, { ...values, priceHistory })
    } else {
      store.add({ ...values, priceHistory: [{ date: values.startDate, price: values.price }] })
    }
    setDialogOpen(false)
  }

  const handleDelete = (sub: Subscription) => {
    if (window.confirm(`Удалить подписку «${sub.name}»?`)) store.remove(sub.id)
  }

  return (
    <div className="relative isolate min-h-dvh bg-background">
      <div className="ambient-glow" aria-hidden="true" />
      <header className="sticky top-0 z-10 border-b bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_24px_-4px] shadow-primary/60">
              <Repeat className="size-4" aria-hidden="true" />
            </div>
            <span className="font-semibold tracking-tight">Подписки</span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="currency" className="sr-only">
              Валюта
            </label>
            <select
              id="currency"
              value={store.currency}
              onChange={(e) => store.setCurrency(e.target.value as Currency)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <BackupControls
              subscriptions={store.subscriptions}
              currency={store.currency}
              onImport={store.importData}
            />
            <Button onClick={openCreate} className="h-9">
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Добавить</span>
              <span className="sr-only sm:hidden">Добавить подписку</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-[1] mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-primary">не вайбкод, все сам!!!!</p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">Трекер подписок</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Все регулярные платежи в одном месте — сколько вы тратите и когда списание.
          </p>
        </div>

        {!store.hydrated ? (
          <div className="h-64 animate-pulse rounded-xl bg-muted" aria-hidden="true" />
        ) : items.length === 0 ? (
          <EmptyState onAdd={openCreate} onLoadSamples={store.loadSamples} />
        ) : (
          <>
            <StatsCards items={items} currency={store.currency} />
            <PriceAnalytics subscriptions={store.subscriptions} currency={store.currency} />
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <SubscriptionList
                  items={items}
                  currency={store.currency}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onTogglePause={(s) => store.edit(s.id, { paused: !s.paused })}
                />
              </div>
              <aside className="flex flex-col gap-6 lg:w-80 lg:shrink-0">
                <UpcomingPayments items={items} currency={store.currency} />
                <CategoryBreakdown items={items} currency={store.currency} />
              </aside>
            </div>
          </>
        )}
      </main>

      <SubscriptionFormDialog
        open={dialogOpen}
        initial={editing}
        currency={store.currency}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
