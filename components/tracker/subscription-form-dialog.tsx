'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CATEGORIES,
  COLORS,
  CYCLE_LABELS,
  startOfToday,
  toISODate,
  type BillingCycle,
  type Currency,
  type Subscription,
} from '@/lib/subscriptions'

type Props = {
  open: boolean
  initial: Subscription | null
  currency: Currency
  onClose: () => void
  onSubmit: (values: Omit<Subscription, 'id'>) => void
}

const inputClass =
  'h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function SubscriptionFormDialog({ open, initial, currency, onClose, onSubmit }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby="form-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/50"
    >
      {open && (
        <SubscriptionForm
          key={initial?.id ?? 'new'}
          initial={initial}
          currency={currency}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </dialog>
  )
}

function SubscriptionForm({ initial, currency, onClose, onSubmit }: Omit<Props, 'open'>) {
  const [color, setColor] = useState(initial?.color ?? COLORS[0])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const price = Number(String(form.get('price') ?? '').replace(',', '.'))
    const startDate = String(form.get('startDate') ?? '')

    if (!name) return setError('Введите название')
    if (!Number.isFinite(price) || price <= 0) return setError('Стоимость должна быть больше нуля')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return setError('Укажите дату платежа')

    onSubmit({
      name: name.slice(0, 60),
      price: Math.round(price * 100) / 100,
      cycle: form.get('cycle') as BillingCycle,
      startDate,
      category: String(form.get('category')),
      color,
      paused: initial?.paused ?? false,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5" noValidate>
      <div className="flex items-center justify-between">
        <h2 id="form-title" className="text-lg font-semibold">
          {initial ? 'Редактировать подписку' : 'Новая подписка'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <Field label="Название" htmlFor="name">
        <input id="name" name="name" defaultValue={initial?.name} placeholder="Например, Netflix" className={inputClass} autoFocus required />
      </Field>

      <div className="flex gap-3">
        <Field label={`Стоимость, ${currency}`} htmlFor="price" className="flex-1">
          <input
            id="price"
            name="price"
            inputMode="decimal"
            defaultValue={initial?.price}
            placeholder="0"
            className={inputClass}
            required
          />
        </Field>
        <Field label="Период" htmlFor="cycle" className="flex-1">
          <select id="cycle" name="cycle" defaultValue={initial?.cycle ?? 'monthly'} className={inputClass}>
            {(Object.keys(CYCLE_LABELS) as BillingCycle[]).map((c) => (
              <option key={c} value={c}>
                {CYCLE_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex gap-3">
        <Field label="Дата платежа" htmlFor="startDate" className="flex-1">
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={initial?.startDate ?? toISODate(startOfToday())}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Категория" htmlFor="category" className="flex-1">
          <select id="category" name="category" defaultValue={initial?.category ?? CATEGORIES[0]} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Цвет</legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <label key={c} className="relative cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="peer sr-only"
              />
              <span className="sr-only">Цвет {c}</span>
              <span
                className="block size-7 rounded-full ring-offset-2 ring-offset-card peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
                style={{ backgroundColor: c }}
                aria-hidden="true"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <p className="text-xs text-muted-foreground">
        Укажите дату любого прошлого или ближайшего списания — следующие даты рассчитаются автоматически.
      </p>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit">{initial ? 'Сохранить' : 'Добавить'}</Button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
