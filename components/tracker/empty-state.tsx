import { Plus, Sparkles, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({ onAdd, onLoadSamples }: { onAdd: () => void; onLoadSamples: () => void }) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Wallet className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Пока нет подписок</h2>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          Добавьте первую подписку, чтобы видеть ежемесячные расходы и ближайшие списания.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Добавить подписку
        </Button>
        <Button variant="outline" onClick={onLoadSamples}>
          <Sparkles className="size-4" aria-hidden="true" />
          Загрузить примеры
        </Button>
      </div>
    </section>
  )
}
