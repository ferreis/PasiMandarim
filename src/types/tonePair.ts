export type ToneNumber = 1 | 2 | 3 | 4 | 5

export type TonePairWord = {
  hanzi: string
  pinyin: string
  meaningPt: string
  tone1: Exclude<ToneNumber, 5>
  tone2: ToneNumber
  slug: string
}

export type TonePairAttempt = {
  pairKey: string
  tone1: Exclude<ToneNumber, 5>
  tone2: ToneNumber
  hanzi: string
  correct: boolean
  answeredAt: string
}
