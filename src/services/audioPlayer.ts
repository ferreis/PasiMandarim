import type { HumanAudioSample, PlayableAudioSample } from '../types/audio'

let activeAudio: HTMLAudioElement | null = null
let resolveActivePlayback: (() => void) | null = null

function resolveAudioUrl(audioUrl: string): string {
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl

  const relativePath = audioUrl.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${relativePath}`
}

export function stopAudio(): void {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }
  resolveActivePlayback?.()
  resolveActivePlayback = null
}

export const stopHumanAudio = stopAudio

export async function playAudioSample(sample: PlayableAudioSample): Promise<void> {
  if ('verifiedHuman' in sample && !sample.verifiedHuman) throw new Error('A gravação humana não foi verificada.')

  stopAudio()

  const audio = new Audio(resolveAudioUrl(sample.audioUrl))
  audio.preload = 'auto'
  activeAudio = audio

  await new Promise<void>((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      audio.removeEventListener('ended', finish)
      audio.removeEventListener('error', fail)
      if (activeAudio === audio) activeAudio = null
      if (resolveActivePlayback === finish) resolveActivePlayback = null
    }

    const finish = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }

    const fail = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Falha ao reproduzir o áudio.'))
    }

    resolveActivePlayback = finish
    audio.addEventListener('ended', finish, { once: true })
    audio.addEventListener('error', fail, { once: true })

    audio.play().catch(() => fail())
  })
}

export function playHumanAudio(sample: HumanAudioSample): Promise<void> {
  return playAudioSample(sample)
}
