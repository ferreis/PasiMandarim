import { reactive, watch } from 'vue'

export const FLASHCARD_SETTINGS_STORAGE_KEY = 'learning-mandarin:flashcard-settings:v1'
export const flashcardQuantityOptions = [5, 10, 20, 30, 50] as const
export const flashcardRepeatDelayOptions = [0, 250, 500, 750, 1000, 1500, 2000] as const

export type FlashcardQuantity = typeof flashcardQuantityOptions[number]
export type FlashcardRepeatDelay = typeof flashcardRepeatDelayOptions[number]

export type FlashcardSettings = {
  quantity: FlashcardQuantity
  autoRepeat: boolean
  studyMode: boolean
  repeatDelayMs: FlashcardRepeatDelay
}

const defaults: FlashcardSettings = {
  quantity: 10,
  autoRepeat: true,
  studyMode: false,
  repeatDelayMs: 500,
}

function includesNumber<T extends readonly number[]>(options: T, value: unknown): value is T[number] {
  return typeof value === 'number' && options.includes(value)
}

function loadSettings(): FlashcardSettings {
  if (typeof window === 'undefined') return { ...defaults }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FLASHCARD_SETTINGS_STORAGE_KEY) ?? '{}') as Partial<FlashcardSettings>
    return {
      quantity: includesNumber(flashcardQuantityOptions, parsed.quantity) ? parsed.quantity : defaults.quantity,
      autoRepeat: typeof parsed.autoRepeat === 'boolean' ? parsed.autoRepeat : defaults.autoRepeat,
      studyMode: typeof parsed.studyMode === 'boolean' ? parsed.studyMode : defaults.studyMode,
      repeatDelayMs: includesNumber(flashcardRepeatDelayOptions, parsed.repeatDelayMs) ? parsed.repeatDelayMs : defaults.repeatDelayMs,
    }
  } catch {
    return { ...defaults }
  }
}

export const flashcardSettings = reactive<FlashcardSettings>(loadSettings())

if (typeof window !== 'undefined') {
  watch(flashcardSettings, (value) => {
    window.localStorage.setItem(FLASHCARD_SETTINGS_STORAGE_KEY, JSON.stringify(value))
  }, { deep: true })
}

export function resetFlashcardSettings(): void {
  Object.assign(flashcardSettings, defaults)
}

export function formatRepeatDelay(milliseconds: number): string {
  if (milliseconds === 0) return 'Sem pausa'
  if (milliseconds < 1000) return `${milliseconds} ms`
  const seconds = milliseconds / 1000
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1).replace('.', ',')} s`
}
