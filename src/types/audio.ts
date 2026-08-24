export type MandarinTone = 1 | 2 | 3 | 4 | 5

export type AudioLicense = {
  name: string
  url: string
}

export type HumanAudioSample = {
  key: string
  pinyin: string
  hanzi?: string
  initial: string
  final: string
  tone: MandarinTone
  audioUrl: string
  originalAudioUrl?: string
  sourcePage: string
  speakerId: string
  speaker: string
  speakerOrigin: string
  source: string
  credits: string
  license: AudioLicense
  localFile: boolean
  verifiedHuman: true
}
