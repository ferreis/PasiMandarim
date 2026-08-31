import type { HumanAudioSample } from '../types/audio'

let activeAudio: HTMLAudioElement | null = null
let resolveActivePlayback: (() => void) | null = null

function resolveAudioUrl(audioUrl: string): string {
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl

  const relativePath = audioUrl.replace(/^\/+/, '')
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

export async function playHumanAudio(sample: HumanAudioSample): Promise<void> {
  if (!sample.verifiedHuman) {
    throw new Error('O áudio de referência precisa ser uma gravação humana verificada.')
  }

  stopActiveAudio()

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
      reject(new Error('Falha ao reproduzir a gravação humana.'))
    }

    resolveActivePlayback = finish
    audio.addEventListener('ended', finish, { once: true })
    audio.addEventListener('error', fail, { once: true })

    audio.play().catch(() => fail())
  })
}
