import { findHumanAudioSample, samplesUseSameSpeaker } from '../data/audioCatalog'
import { ttsAudioSamples } from '../data/ttsAudioCatalog'
import type { MandarinTone, PlayableAudioSample, TtsAudioSample, TtsVoiceId } from '../types/audio'
import type { FlashcardAudioSource } from './flashcardSettings'

export type AudioProvider = {
  find(initial: string, final: string, tone: MandarinTone): PlayableAudioSample | undefined
}

export type ResolvedComparisonAudio = {
  sampleA: PlayableAudioSample
  sampleB: PlayableAudioSample
  sameSpeaker: boolean
}

export class HumanAudioProvider implements AudioProvider {
  find(initial: string, final: string, tone: MandarinTone): PlayableAudioSample | undefined {
    return findHumanAudioSample(initial, final, tone)
  }
}

export class TtsAudioProvider implements AudioProvider {
  private readonly samples = new Map<string, TtsAudioSample>()

  constructor(voice: TtsVoiceId) {
    for (const sample of ttsAudioSamples) {
      if (sample.voice === voice) this.samples.set(sample.key, sample)
    }
  }

  find(initial: string, final: string, tone: MandarinTone): TtsAudioSample | undefined {
    return this.samples.get(`${initial}|${final}|${tone}`)
  }
}

/** Resolves samples outside Vue components; hybrid mode falls back per side. */
export function resolveComparisonAudio(
  initialA: string,
  initialB: string,
  final: string,
  tone: MandarinTone,
  source: FlashcardAudioSource,
  voice: TtsVoiceId,
): ResolvedComparisonAudio | undefined {
  const human = new HumanAudioProvider()
  const tts = new TtsAudioProvider(voice)
  const select = (initial: string): PlayableAudioSample | undefined => {
    if (source === 'human') return human.find(initial, final, tone)
    if (source === 'tts') return tts.find(initial, final, tone)
    return human.find(initial, final, tone) ?? tts.find(initial, final, tone)
  }
  const sampleA = select(initialA)
  const sampleB = select(initialB)
  if (!sampleA || !sampleB) return undefined
  const sameSpeaker = 'verifiedHuman' in sampleA && 'verifiedHuman' in sampleB
    ? samplesUseSameSpeaker(sampleA, sampleB)
    : false
  return { sampleA, sampleB, sameSpeaker }
}
