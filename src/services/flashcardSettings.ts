import { reactive, watch } from 'vue'
import type { TtsVoiceId } from '../types/audio'

export const FLASHCARD_SETTINGS_STORAGE_KEY = 'learning-mandarin:flashcard-settings:v1'
export const flashcardQuantityOptions = [5, 10, 20, 30, 50] as const
export const flashcardRepeatDelayOptions = [0, 250, 500, 750, 1000, 1500, 2000] as const

export type FlashcardQuantity = typeof flashcardQuantityOptions[number]
export type FlashcardRepeatDelay = typeof flashcardRepeatDelayOptions[number]
export const flashcardAudioSourceOptions = ['human', 'tts', 'human-tts'] as const
export type FlashcardAudioSource = typeof flashcardAudioSourceOptions[number]
export const recommendedTtsVoice: TtsVoiceId = 'zh-CN-XiaoxiaoNeural'
export const flashcardTtsVoiceOptions = [
  { value: 'recommended', label: 'Recomendada' },
  { value: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao (feminina)' },
  { value: 'zh-CN-YunxiNeural', label: 'Yunxi (masculina)' },
  { value: 'zh-CN-XiaoyiNeural', label: 'Xiaoyi (feminina)' },
] as const
export type FlashcardTtsVoiceSelection = typeof flashcardTtsVoiceOptions[number]['value']

export type FlashcardSettings = {
  quantity: FlashcardQuantity
  autoRepeat: boolean
  studyMode: boolean
  repeatDelayMs: FlashcardRepeatDelay
  audioSource: FlashcardAudioSource
  ttsVoice: FlashcardTtsVoiceSelection
}

const defaults: FlashcardSettings = {
  quantity: 10,
  autoRepeat: true,
  studyMode: false,
  repeatDelayMs: 500,
  audioSource: 'human',
  ttsVoice: 'recommended',
}

function includesNumber<T extends readonly number[]>(options: T, value: unknown): value is T[number] {
  return typeof value === 'number' && options.includes(value)
}

function includesString<T extends readonly string[]>(options: T, value: unknown): value is T[number] {
  return typeof value === 'string' && options.includes(value)
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
      audioSource: includesString(flashcardAudioSourceOptions, parsed.audioSource) ? parsed.audioSource : defaults.audioSource,
      ttsVoice: includesString(flashcardTtsVoiceOptions.map((option) => option.value), parsed.ttsVoice) ? parsed.ttsVoice : defaults.ttsVoice,
    }
  } catch {
    return { ...defaults }
  }
}

export function resolveFlashcardTtsVoice(selection: FlashcardTtsVoiceSelection): TtsVoiceId {
  return selection === 'recommended' ? recommendedTtsVoice : selection
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
