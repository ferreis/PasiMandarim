export type ArticulationDiagram =
  | 'bilabial'
  | 'labiodental'
  | 'alveolar'
  | 'dental'
  | 'alveolopalatal'
  | 'retroflex'
  | 'velar'

export type InitialPronunciationGuide = {
  initial: string
  ipa: string
  aspiration: 'Aspirada' | 'Não aspirada' | 'Não se aplica'
  voicing: 'Surda' | 'Sonora'
  manner: string
  place: string
  family: string
  tongue: string
  lips: string
  production: string
  commonMistake: string
  portugueseReference: string
  contrast?: string
  diagram: ArticulationDiagram
}
