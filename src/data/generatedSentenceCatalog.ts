// Arquivo preenchido por scripts/sync-sentence-audio.mjs durante validação e deploy.

export type SentenceSyllable = {
  hanzi: string
  pinyin: string
  numbered: string
  initial: string
  final: string
  tone: number
}

export type SentencePracticeItem = {
  id: number
  text: string
  translationPt: string
  pinyin: string
  syllables: SentenceSyllable[]
  audio: {
    id: number
    path: string
    author: string
    license: string
    attributionUrl: string
  }
  sourceUrl: string
  textLicense: string
}

export const sentencePracticeCatalog: SentencePracticeItem[] = []
