export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type Currency = 'RUB' | 'USD' | 'EUR'

export type Subscription = {
  id: string
  name: string
  price: number
  cycle: BillingCycle
  startDate: string
  category: string
  color: string
  paused: boolean
  priceHistory?: PricePoint[]
}

export type PricePoint = { date: string; price: number }

export function getPriceHistory(sub: Subscription): PricePoint[] {
  if (sub.priceHistory && sub.priceHistory.length > 0) {
    return [...sub.priceHistory].sort((a, b) => a.date.localeCompare(b.date))
  }
  return [{ date: sub.startDate, price: sub.price }]
}

export function withPriceChange(sub: Subscription, newPrice: number): PricePoint[] {
  const today = toISODate(startOfToday())
  const history = getPriceHistory(sub).filter((p) => p.date !== today)
  return [...history, { date: today, price: newPrice }]
}

export const CATEGORIES = [
  'Развлечения',
  'Музыка',
  'Работа',
  'Облако',
  'Обучение',
  'Здоровье',
  'Другое',
] as const

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  quarterly: 'Раз в квартал',
  yearly: 'Ежегодно',
}

export const CYCLE_SHORT: Record<BillingCycle, string> = {
  weekly: 'нед',
  monthly: 'мес',
  quarterly: 'кв',
  yearly: 'год',
}

export const CURRENCIES: Currency[] = ['RUB', 'USD', 'EUR']

export const COLORS = [
  '#10b981',
  '#ef4444',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#64748b',
]

const MONTHS_PER_CYCLE: Record<Exclude<BillingCycle, 'weekly'>, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
}

export function monthlyCost(sub: Subscription) {
  switch (sub.cycle) {
    case 'weekly':
      return (sub.price * 52) / 12
    case 'monthly':
      return sub.price
    case 'quarterly':
      return sub.price / 3
    case 'yearly':
      return sub.price / 12
  }
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function addMonthsClamped(date: Date, months: number) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return target
}

const DAY_MS = 24 * 60 * 60 * 1000

export function getNextPayment(sub: Subscription, today = startOfToday()) {
  const start = parseISODate(sub.startDate)
  if (start >= today) return start

  if (sub.cycle === 'weekly') {
    const diffDays = Math.round((today.getTime() - start.getTime()) / DAY_MS)
    const weeks = Math.ceil(diffDays / 7)
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + weeks * 7)
  }

  const step = MONTHS_PER_CYCLE[sub.cycle]
  let periods = Math.max(
    0,
    Math.floor(
      ((today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth()) / step,
    ),
  )
  let next = addMonthsClamped(start, periods * step)
  while (next < today) {
    periods += 1
    next = addMonthsClamped(start, periods * step)
  }
  return next
}

export function daysUntil(date: Date, today = startOfToday()) {
  return Math.round((date.getTime() - today.getTime()) / DAY_MS)
}

const dayRules = new Intl.PluralRules('ru-RU')

export function pluralDays(n: number) {
  const form = dayRules.select(n)
  if (form === 'one') return `${n} день`
  if (form === 'few') return `${n} дня`
  return `${n} дней`
}

export function relativeDays(days: number) {
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Завтра'
  return `Через ${pluralDays(days)}`
}

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export function formatDate(date: Date) {
  return dateFormatter.format(date)
}

function offsetDate(days: number) {
  const today = startOfToday()
  return toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days))
}

function offsetMonths(months: number) {
  const today = startOfToday()
  return toISODate(new Date(today.getFullYear(), today.getMonth() + months, Math.min(today.getDate(), 10)))
}

export function createSampleSubscriptions(): Subscription[] {
  const samples: Omit<Subscription, 'id'>[] = [
    { name: 'Кинопоиск', price: 399, cycle: 'monthly', startDate: offsetDate(2), category: 'Развлечения', color: '#f59e0b', paused: false },
    { name: 'Spotify', price: 299, cycle: 'monthly', startDate: offsetDate(-24), category: 'Музыка', color: '#10b981', paused: false },
    { name: 'iCloud+', price: 149, cycle: 'monthly', startDate: offsetDate(11), category: 'Облако', color: '#3b82f6', paused: false },
    { name: 'ChatGPT Plus', price: 1990, cycle: 'monthly', startDate: offsetDate(5), category: 'Работа', color: '#14b8a6', paused: false },
    { name: 'Notion', price: 4800, cycle: 'yearly', startDate: offsetDate(-300), category: 'Работа', color: '#64748b', paused: false },
    { name: 'Duolingo', price: 2990, cycle: 'yearly', startDate: offsetDate(-200), category: 'Обучение', color: '#8b5cf6', paused: false },
    { name: 'Фитнес-клуб', price: 3500, cycle: 'monthly', startDate: offsetDate(18), category: 'Здоровье', color: '#ef4444', paused: false },
    { name: 'YouTube Premium', price: 299, cycle: 'monthly', startDate: offsetDate(-3), category: 'Развлечения', color: '#ec4899', paused: true },
  ]
  const history: Record<string, [number, number][]> = {
    Кинопоиск: [[-14, 299], [-5, 399]],
    Spotify: [[-14, 169], [-8, 199], [-2, 299]],
    'iCloud+': [[-14, 99], [-7, 149]],
    'ChatGPT Plus': [[-13, 1790], [-3, 1990]],
    Notion: [[-14, 4200], [-10, 4800]],
    Duolingo: [[-14, 3490], [-6, 2990]],
    'Фитнес-клуб': [[-14, 3000], [-1, 3500]],
    'YouTube Premium': [[-12, 299]],
  }
  return samples.map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    priceHistory: history[s.name]?.map(([months, price]) => ({ date: offsetMonths(months), price })),
  }))
}
