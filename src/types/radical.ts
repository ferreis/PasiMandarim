export type RadicalHistoricalForm = 'oracle' | 'bronze' | 'seal' | 'liushutong'

export type MandarinRadical = {
  number: number
  character: string
  radicalCharacter: string
  variants: string[]
  strokes: number
  pinyin: string
  zhuyin: string
  meaningPt: string
  meaningEn: string
  explanationPt: string
  historicalForms: RadicalHistoricalForm[]
  exampleCharacters: string[]
  sourceUrl: string
}
