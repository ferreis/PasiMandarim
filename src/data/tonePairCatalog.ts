import rawTonePairWords from '../../data/tone-pairs.json'
import type { TonePairWord } from '../types/tonePair'

export const tonePairWords = rawTonePairWords as TonePairWord[]

export function tonePairKey(tone1: number, tone2: number): string {
  return `${tone1}-${tone2}`
}

export function tonePairAudioPath(word: TonePairWord): string {
  return `/audio/tone-pairs/sinosplice/${word.slug}.mp3`
}

export function getTonePairWords(tone1: number, tone2: number): TonePairWord[] {
  return tonePairWords.filter((word) => word.tone1 === tone1 && word.tone2 === tone2)
}
