'use client'

import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CURRENCIES, type Currency, type Subscription } from '@/lib/subscriptions'

type Props = {
  subscriptions: Subscription[]
  currency: Currency
  onImport: (data: { subscriptions: Subscription[]; currency: Currency }) => void
}

function isSubscription(value: unknown): value is Subscription {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  return typeof s.id === 'string' && typeof s.name === 'string' && typeof s.price === 'number'
}

export function BackupControls({ subscriptions, currency, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ subscriptions, currency }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      const list: unknown[] = Array.isArray(parsed?.subscriptions) ? parsed.subscriptions : []
      const valid = list.filter(isSubscription)
      if (valid.length === 0) throw new Error('empty')
      const nextCurrency = CURRENCIES.includes(parsed.currency) ? (parsed.currency as Currency) : currency
      if (window.confirm(`Заменить текущие данные? Будет загружено подписок: ${valid.length}.`)) {
        onImport({ subscriptions: valid, currency: nextCurrency })
      }
    } catch {
      window.alert('Не удалось прочитать файл. Выберите JSON, экспортированный из трекера.')
    }
  }

  return (
    <>
      <Button variant="outline" size="icon" className="size-9" onClick={handleExport} disabled={subscriptions.length === 0}>
        <Download className="size-4" aria-hidden="true" />
        <span className="sr-only">Экспорт в JSON</span>
      </Button>
      <Button variant="outline" size="icon" className="size-9" onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" aria-hidden="true" />
        <span className="sr-only">Импорт из JSON</span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
