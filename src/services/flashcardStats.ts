import type { MandarinTone } from '../types/audio'

export type FlashcardAttempt = {
  pairKey: string
  initialA: string
  initialB: string
  final: string
  tone: MandarinTone
  targetInitial: string
  correct: boolean
  answeredAt: string
}

const STORAGE_KEY = 'learning-mandarin:flashcard-attempts:v1'
const MAX_ATTEMPTS = 5000

export function buildInitialPairKey(initialA: string, initialB: string): string {
  return [initialA, initialB].sort((left, right) => left.localeCompare(right)).join('|')
}

export function loadFlashcardAttempts(): FlashcardAttempt[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((attempt): attempt is FlashcardAttempt =>
      Boolean(
        attempt &&
        typeof attempt.pairKey === 'string' &&
        typeof attempt.initialA === 'string' &&
        typeof attempt.initialB === 'string' &&
        typeof attempt.final === 'string' &&
        typeof attempt.tone === 'number' &&
        typeof attempt.correct === 'boolean' &&
        typeof attempt.answeredAt === 'string',
      ),
    )
  } catch {
    return []
  }
}

export function saveFlashcardAttempt(attempt: Omit<FlashcardAttempt, 'pairKey' | 'answeredAt'>): FlashcardAttempt[] {
  const attempts = loadFlashcardAttempts()
  const storedAttempt: FlashcardAttempt = {
    ...attempt,
    pairKey: buildInitialPairKey(attempt.initialA, attempt.initialB),
    answeredAt: new Date().toISOString(),
  }

  const updated = [...attempts, storedAttempt].slice(-MAX_ATTEMPTS)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function clearFlashcardAttemptsForPair(initialA: string, initialB: string): FlashcardAttempt[] {
  const pairKey = buildInitialPairKey(initialA, initialB)
  const updated = loadFlashcardAttempts().filter((attempt) => attempt.pairKey !== pairKey)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}
