import pinyinMatrix from '../../data/pinyin-matrix.json'
import tonePairs from '../../data/tone-pairs.json'
import type { TonePairWord } from '../types/tonePair'

/**
 * Read-only access point for the public catalogues bundled with the static app.
 *
 * JSON is intentionally imported at build time: Vite includes it in the static
 * bundle, so the application stays deployable on GitHub Pages and does not need
 * a server, IndexedDB, or a SQLite/WASM runtime.
 */
export type PinyinInitialOption = {
  value: string
  label: string
  finals: string[]
}

const pinyinInitials = pinyinMatrix.initials as PinyinInitialOption[]
const tonePairWords = tonePairs as TonePairWord[]
const finalsByInitial = new Map(
  pinyinInitials.map((initial) => [initial.value, initial.finals] as const),
)

export function getPinyinInitials(): readonly PinyinInitialOption[] {
  return pinyinInitials
}

export function getFinalsForInitial(initial: string): readonly string[] {
  return finalsByInitial.get(initial) ?? []
}

export function getCommonFinals(initialA: string, initialB: string): string[] {
  const right = new Set(getFinalsForInitial(initialB))
  return getFinalsForInitial(initialA).filter((final) => right.has(final))
}

export function isValidPinyinCombination(initial: string, final: string): boolean {
  return getFinalsForInitial(initial).includes(final)
}

export function getTonePairWords(): readonly TonePairWord[] {
  return tonePairWords
}

export function getTonePairWordsForTones(tone1: number, tone2: number): TonePairWord[] {
  return tonePairWords.filter((word) => word.tone1 === tone1 && word.tone2 === tone2)
}

export function tonePairKey(tone1: number, tone2: number): string {
  return `${tone1}-${tone2}`
}

export function tonePairAudioPath(word: TonePairWord): string {
  return `/audio/tone-pairs/sinosplice/${word.slug}.mp3`
}
