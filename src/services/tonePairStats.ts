import type { TonePairAttempt } from '../types/tonePair'

const STORAGE_KEY = 'learning-mandarin:tone-pair-attempts:v1'
const MAX_ATTEMPTS = 2_000

function isAttempt(value: unknown): value is TonePairAttempt {
  if (!value || typeof value !== 'object') return false
  const attempt = value as Partial<TonePairAttempt>
  return (
    typeof attempt.pairKey === 'string' &&
    [1, 2, 3, 4].includes(Number(attempt.tone1)) &&
    [1, 2, 3, 4, 5].includes(Number(attempt.tone2)) &&
    typeof attempt.hanzi === 'string' &&
    typeof attempt.correct === 'boolean' &&
    typeof attempt.answeredAt === 'string'
  )
}

export function loadTonePairAttempts(): TonePairAttempt[] {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isAttempt).slice(-MAX_ATTEMPTS)
  } catch {
    return []
  }
}

export function saveTonePairAttempt(attempt: Omit<TonePairAttempt, 'answeredAt'>): TonePairAttempt[] {
  const attempts = loadTonePairAttempts()
  attempts.push({ ...attempt, answeredAt: new Date().toISOString() })
  const limited = attempts.slice(-MAX_ATTEMPTS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
  return limited
}

export function clearTonePairAttempts(): TonePairAttempt[] {
  localStorage.removeItem(STORAGE_KEY)
  return []
}
