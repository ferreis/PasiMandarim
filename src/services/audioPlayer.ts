import type { HumanAudioSample } from '../types/audio'

let activeAudio: HTMLAudioElement | null = null

export async function playHumanAudio(sample: HumanAudioSample): Promise<void> {
  if (!sample.verifiedHuman) {
    throw new Error('O áudio de referência precisa ser uma gravação humana verificada.')
  }

  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
  }

  const audio = new Audio(sample.audioUrl)
  audio.preload = 'auto'
  activeAudio = audio

  try {
    await audio.play()
  } finally {
    audio.addEventListener(
      'ended',
      () => {
        if (activeAudio === audio) {
          activeAudio = null
        }
      },
      { once: true },
    )
  }
}
