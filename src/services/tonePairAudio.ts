import { tonePairAudioPath } from '../data/tonePairCatalog'
import type { TonePairWord } from '../types/tonePair'

let activeAudio: HTMLAudioElement | null = null

function resolveAudioUrl(path: string): string {
  const relativePath = path.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${relativePath}`
}

export async function playTonePairWord(word: TonePairWord): Promise<void> {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
  }

  const audio = new Audio(resolveAudioUrl(tonePairAudioPath(word)))
  audio.preload = 'auto'
  activeAudio = audio

  try {
    await audio.play()
  } finally {
    audio.addEventListener(
      'ended',
      () => {
        if (activeAudio === audio) activeAudio = null
      },
      { once: true },
    )
  }
}
