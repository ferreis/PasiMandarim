import { readonly, ref } from 'vue'
import { playAudioSample, stopAudio } from './audioPlayer'
import type { PlayableAudioSample } from '../types/audio'

export type ComparisonSide = 'a' | 'b'

export type ComparisonAudioItem = {
  side: ComparisonSide
  sample: PlayableAudioSample
}

export type ComparisonAudioPlaybackOptions = {
  gapMs?: number
  visualFeedback?: boolean
}

/**
 * Controls every playback associated with one pronunciation-comparison card.
 * Starting a new sound cancels the previous run, which keeps the visual state
 * aligned with the single audio element managed by audioPlayer.
 */
export function useComparisonAudioFeedback() {
  const activeSide = ref<ComparisonSide | null>(null)
  const isPlaying = ref(false)
  const error = ref('')
  let generation = 0

  function clearError(): void {
    error.value = ''
  }

  function setError(message: string): void {
    error.value = message
  }

  function stop(): void {
    generation += 1
    stopAudio()
    activeSide.value = null
    isPlaying.value = false
  }

  function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
  }

  async function play(
    items: readonly ComparisonAudioItem[],
    { gapMs = 0, visualFeedback = true }: ComparisonAudioPlaybackOptions = {},
  ): Promise<boolean> {
    if (!items.length) return false

    const currentGeneration = ++generation
    stopAudio()
    clearError()
    isPlaying.value = true

    try {
      for (let index = 0; index < items.length; index += 1) {
        if (currentGeneration !== generation) return false

        const item = items[index]
        if (visualFeedback) activeSide.value = item.side
        await playAudioSample(item.sample)

        if (currentGeneration !== generation) return false
        if (visualFeedback) activeSide.value = null

        if (index < items.length - 1 && gapMs > 0) {
          await wait(gapMs)
          if (currentGeneration !== generation) return false
        }
      }

      return true
    } catch {
      if (currentGeneration === generation) {
        error.value = 'Não foi possível reproduzir este áudio.'
      }
      return false
    } finally {
      if (currentGeneration === generation) {
        activeSide.value = null
        isPlaying.value = false
      }
    }
  }

  function playSide(
    side: ComparisonSide,
    sample: PlayableAudioSample,
    options?: ComparisonAudioPlaybackOptions,
  ): Promise<boolean> {
    return play([{ side, sample }], options)
  }

  function playContrast(
    sampleA: PlayableAudioSample,
    sampleB: PlayableAudioSample,
    options?: ComparisonAudioPlaybackOptions,
  ): Promise<boolean> {
    return play([
      { side: 'a', sample: sampleA },
      { side: 'b', sample: sampleB },
    ], options)
  }

  return {
    activeSide: readonly(activeSide),
    clearError,
    error: readonly(error),
    isPlaying: readonly(isPlaying),
    playContrast,
    playSide,
    setError,
    stop,
  }
}
