import { tonePairAudioPath } from './publicDataRepository'
import type { TonePairWord } from '../types/tonePair'

let activeAudio: HTMLAudioElement | null = null
let resolveActivePlayback: (() => void) | null = null
let playbackGeneration = 0

function resolveAudioUrl(path: string): string {
  const relativePath = path.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${relativePath}`
}

function stopActiveAudio(): void {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }
  resolveActivePlayback?.()
  resolveActivePlayback = null
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

async function playOnce(word: TonePairWord, generation: number): Promise<void> {
  if (generation !== playbackGeneration) return

  const audio = new Audio(resolveAudioUrl(tonePairAudioPath(word)))
  audio.preload = 'auto'
  activeAudio = audio

  await audio.play()
  if (generation !== playbackGeneration) return

  await new Promise<void>((resolve, reject) => {
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      if (activeAudio === audio) activeAudio = null
      if (resolveActivePlayback === finish) resolveActivePlayback = null
      resolve()
    }

    resolveActivePlayback = finish
    audio.addEventListener('ended', finish, { once: true })
    audio.addEventListener('error', () => {
      if (settled) return
      settled = true
      if (activeAudio === audio) activeAudio = null
      if (resolveActivePlayback === finish) resolveActivePlayback = null
      reject(new Error('Falha ao reproduzir a gravação humana.'))
    }, { once: true })
  })
}

export function stopTonePairAudio(): void {
  playbackGeneration += 1
  stopActiveAudio()
}

export async function playTonePairWord(
  word: TonePairWord,
  repetitions = 1,
  gapMs = 260,
): Promise<void> {
  const safeRepetitions = Math.min(5, Math.max(1, Math.trunc(repetitions)))
  playbackGeneration += 1
  const generation = playbackGeneration
  stopActiveAudio()

  for (let index = 0; index < safeRepetitions; index += 1) {
    if (generation !== playbackGeneration) return
    await playOnce(word, generation)
    if (generation !== playbackGeneration) return
    if (index < safeRepetitions - 1) await wait(gapMs)
  }
}
