'use client'

import { useSyncExternalStore } from 'react'
import { createSampleSubscriptions, type Currency, type Subscription } from './subscriptions'

const STORAGE_KEY = 'subscription-tracker:v1'

type StoreData = {
  subscriptions: Subscription[]
  currency: Currency
}

const listeners = new Set<() => void>()
let cachedRaw: string | null | undefined
let cachedData: StoreData | null = null

function read(): StoreData | null {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    try {
      cachedData = raw ? (JSON.parse(raw) as StoreData) : null
    } catch {
      cachedData = null
    }
  }
  return cachedData
}

function write(data: StoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  listeners.forEach((listener) => listener())
}

function update(fn: (data: StoreData) => StoreData) {
  write(fn(read() ?? { subscriptions: [], currency: 'RUB' }))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

const noopSubscribe = () => () => {}

export function useSubscriptions() {
  const data = useSyncExternalStore(subscribe, read, () => null)
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)

  return {
    hydrated,
    subscriptions: data?.subscriptions ?? [],
    currency: data?.currency ?? ('RUB' as Currency),
    add(sub: Omit<Subscription, 'id'>) {
      update((d) => ({ ...d, subscriptions: [...d.subscriptions, { ...sub, id: crypto.randomUUID() }] }))
    },
    edit(id: string, patch: Partial<Subscription>) {
      update((d) => ({
        ...d,
        subscriptions: d.subscriptions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }))
    },
    remove(id: string) {
      update((d) => ({ ...d, subscriptions: d.subscriptions.filter((s) => s.id !== id) }))
    },
    setCurrency(currency: Currency) {
      update((d) => ({ ...d, currency }))
    },
    importData(data: StoreData) {
      write(data)
    },
    loadSamples() {
      update((d) => ({ ...d, subscriptions: [...d.subscriptions, ...createSampleSubscriptions()] }))
    },
  }
}
