import {
  getTonePairWords as getAllTonePairWords,
  getTonePairWordsForTones,
  tonePairAudioPath,
  tonePairKey,
} from '../services/publicDataRepository'
import type { TonePairWord } from '../types/tonePair'

export { tonePairAudioPath, tonePairKey }

/** @deprecated Import getTonePairWords() from services/publicDataRepository. */
export const tonePairWords = getAllTonePairWords()

/** @deprecated Import getTonePairWordsForTones() from services/publicDataRepository. */
export function getTonePairWords(tone1: number, tone2: number): TonePairWord[] {
  return getTonePairWordsForTones(tone1, tone2)
}
