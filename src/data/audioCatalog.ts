import type { AudioMinimalPair, AudioResearchCandidate } from '../types/audio'

const ccBy20Fr = {
  name: 'CC BY 2.0 FR',
  url: 'https://creativecommons.org/licenses/by/2.0/fr/',
}

export const verifiedAudioPairs: AudioMinimalPair[] = [
  {
    id: 'bp-ian-1-wei-gao',
    contrast: 'b-p',
    final: 'ian',
    tone: 1,
    sameSpeaker: true,
    verified: true,
    left: {
      pinyin: 'biān',
      hanzi: '边',
      initial: 'b',
      final: 'ian',
      tone: 1,
      audioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zh-bi%C4%81n.ogg',
      sourcePage: 'https://commons.wikimedia.org/wiki/File:Zh-bi%C4%81n.ogg',
      speaker: 'Wei Gao',
      speakerOrigin: 'Pequim, China',
      source: 'Shtooka Project / Wikimedia Commons',
      credits: 'Wei Gao e Vion Nicolas',
      license: ccBy20Fr,
      verifiedHuman: true,
    },
    right: {
      pinyin: 'piān',
      hanzi: '篇',
      initial: 'p',
      final: 'ian',
      tone: 1,
      audioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zh-pi%C4%81n.ogg',
      sourcePage: 'https://commons.wikimedia.org/wiki/File:Zh-pi%C4%81n.ogg',
      speaker: 'Wei Gao',
      speakerOrigin: 'Pequim, China',
      source: 'Shtooka Project / Wikimedia Commons',
      credits: 'Wei Gao e Vion Nicolas',
      license: ccBy20Fr,
      verifiedHuman: true,
    },
  },
]

// Estes pares foram encontrados no acervo, mas ainda não são liberados no treino.
// Só passam para verifiedAudioPairs após confirmar os dois arquivos, o falante e a licença.
export const audioResearchCandidates: AudioResearchCandidate[] = [
  {
    id: 'bp-ao-3',
    contrast: 'b-p',
    final: 'ao',
    tone: 3,
    leftPinyin: 'bǎo',
    rightPinyin: 'pǎo',
    status: 'pending-verification',
    note: 'bǎo está confirmado como Wei Gao; falta validar os metadados completos de pǎo.',
  },
  {
    id: 'bp-ian-4',
    contrast: 'b-p',
    final: 'ian',
    tone: 4,
    leftPinyin: 'biàn',
    rightPinyin: 'piàn',
    status: 'pending-verification',
    note: 'biàn está confirmado como Wei Gao; falta validar os metadados completos de piàn.',
  },
  {
    id: 'bp-ai-2',
    contrast: 'b-p',
    final: 'ai',
    tone: 2,
    leftPinyin: 'bái',
    rightPinyin: 'pái',
    status: 'pending-verification',
    note: 'bái está confirmado como Wei Gao; falta validar os metadados completos de pái.',
  },
]
