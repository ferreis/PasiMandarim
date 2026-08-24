import { generatedAudioSamples } from './generatedAudioCatalog'
import type { HumanAudioSample, MandarinTone } from '../types/audio'

const ccBy20Fr = {
  name: 'CC BY 2.0 FR',
  url: 'https://creativecommons.org/licenses/by/2.0/fr/',
}

const curatedRemoteSamples: HumanAudioSample[] = [
  {
    key: 'b|ian|1',
    pinyin: 'biān',
    hanzi: '边',
    initial: 'b',
    final: 'ian',
    tone: 1,
    audioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zh-bi%C4%81n.ogg',
    originalAudioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zh-bi%C4%81n.ogg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Zh-bi%C4%81n.ogg',
    speakerId: 'wei-gao',
    speaker: 'Wei Gao',
    speakerOrigin: 'Pequim, China',
    source: 'Shtooka Project / Wikimedia Commons',
    credits: 'Wei Gao e Vion Nicolas',
    license: ccBy20Fr,
    localFile: false,
    verifiedHuman: true,
  },
  {
    key: 'p|ian|1',
    pinyin: 'piān',
    hanzi: '篇',
    initial: 'p',
    final: 'ian',
    tone: 1,
    audioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zh-pi%C4%81n.ogg',
    originalAudioUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zh-pi%C4%81n.ogg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Zh-pi%C4%81n.ogg',
    speakerId: 'wei-gao',
    speaker: 'Wei Gao',
    speakerOrigin: 'Pequim, China',
    source: 'Shtooka Project / Wikimedia Commons',
    credits: 'Wei Gao e Vion Nicolas',
    license: ccBy20Fr,
    localFile: false,
    verifiedHuman: true,
  },
]

const sampleMap = new Map<string, HumanAudioSample>()

for (const sample of curatedRemoteSamples) sampleMap.set(sample.key, sample)
for (const sample of generatedAudioSamples) sampleMap.set(sample.key, sample)

export const humanAudioSamples = [...sampleMap.values()]

export function audioSampleKey(initial: string, final: string, tone: MandarinTone): string {
  return `${initial}|${final}|${tone}`
}

export function findHumanAudioSample(
  initial: string,
  final: string,
  tone: MandarinTone,
): HumanAudioSample | undefined {
  return sampleMap.get(audioSampleKey(initial, final, tone))
}

export function samplesUseSameSpeaker(
  left?: HumanAudioSample,
  right?: HumanAudioSample,
): boolean {
  return Boolean(left && right && left.speakerId === right.speakerId)
}
