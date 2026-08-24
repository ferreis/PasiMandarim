export type MandarinTone = 1 | 2 | 3 | 4 | 5

export type AudioLicense = {
  name: string
  url: string
}

export type HumanAudioSample = {
  pinyin: string
  hanzi: string
  initial: string
  final: string
  tone: MandarinTone
  audioUrl: string
  sourcePage: string
  speaker: string
  speakerOrigin: string
  source: string
  credits: string
  license: AudioLicense
  verifiedHuman: true
}

export type AudioMinimalPair = {
  id: string
  contrast: string
  final: string
  tone: MandarinTone
  left: HumanAudioSample
  right: HumanAudioSample
  sameSpeaker: boolean
  verified: boolean
}

export type AudioResearchCandidate = {
  id: string
  contrast: string
  final: string
  tone: MandarinTone
  leftPinyin: string
  rightPinyin: string
  status: 'pending-verification'
  note: string
}
