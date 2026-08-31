<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue'
import { humanAudioSamples } from '../data/audioCatalog'
import { pinyinInitials } from '../data/pinyinMatrix'
import { toneDisplay } from '../data/toneDisplay'
import { playHumanAudio } from '../services/audioPlayer'
import {
  flashcardQuantityOptions,
  flashcardSettings,
} from '../services/flashcardSettings'
import { comparePronunciation, type PronunciationReport } from '../services/pronunciationAnalysis'
import type { HumanAudioSample, MandarinTone } from '../types/audio'

const samples = humanAudioSamples.filter((sample) => sample.verifiedHuman && sample.tone !== 5)
const initialOptions = pinyinInitials.filter((initial) => samples.some((sample) => sample.initial === initial.value))
const selectedInitial = ref(initialOptions.some((initial) => initial.value === 'b') ? 'b' : initialOptions[0]?.value ?? '')
const selectedFinal = ref('')
const selectedTone = ref<MandarinTone>(1)
const recording = ref(false)
const analyzing = ref(false)
const microphoneError = ref('')
const report = ref<PronunciationReport | null>(null)
const recordingUrl = ref('')
const requestedCards = toRef(flashcardSettings, 'quantity')
const autoRepeat = toRef(flashcardSettings, 'autoRepeat')
const repeatDelayMs = toRef(flashcardSettings, 'repeatDelayMs')
const sessionSamples = ref<HumanAudioSample[]>([])
const currentIndex = ref(0)
const sessionActive = ref(false)
const sessionFinished = ref(false)
const sessionScores = ref<number[]>([])

const quantityOptions = flashcardQuantityOptions
const AUTO_REPETITIONS = 3

let mediaRecorder: MediaRecorder | null = null
let activeStream: MediaStream | null = null
let chunks: BlobPart[] = []
let stopTimer: number | undefined

const availableFinals = computed(() => [...new Set(
  samples.filter((sample) => sample.initial === selectedInitial.value).map((sample) => sample.final),
)].sort())
const availableTones = computed(() => [...new Set(
  samples
    .filter((sample) => sample.initial === selectedInitial.value && sample.final === selectedFinal.value)
    .map((sample) => sample.tone),
)].sort() as MandarinTone[])
const selectedSample = computed<HumanAudioSample | undefined>(() => samples.find((sample) =>
  sample.initial === selectedInitial.value
  && sample.final === selectedFinal.value
  && sample.tone === selectedTone.value,
))
const averageSessionScore = computed(() => sessionScores.value.length
  ? Math.round(sessionScores.value.reduce((sum, value) => sum + value, 0) / sessionScores.value.length)
  : 0)

watch(availableFinals, (finals) => {
  if (!finals.includes(selectedFinal.value)) selectedFinal.value = finals[0] ?? ''
}, { immediate: true })

watch(availableTones, (tones) => {
  if (!tones.includes(selectedTone.value)) selectedTone.value = tones[0] ?? 1
}, { immediate: true })

watch([selectedInitial, selectedFinal, selectedTone], () => {
  report.value = null
  microphoneError.value = ''
  revokeRecordingUrl()
})

const chartBounds = computed(() => {
  if (!report.value) return { min: -4, max: 4 }
  const values = [...report.value.referenceContour, ...report.value.userContour]
  const min = Math.min(...values) - 0.5
  const max = Math.max(...values) + 0.5
  return max - min < 1 ? { min: min - 1, max: max + 1 } : { min, max }
})

function randomIndex(max: number): number {
  if (max <= 1) return 0
  const limit = Math.floor(0x100000000 / max) * max
  const buffer = new Uint32Array(1)
  do globalThis.crypto.getRandomValues(buffer)
  while (buffer[0] >= limit)
  return buffer[0] % max
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1)
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function waitRepeatDelay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function buildSession(count: number): HumanAudioSample[] {
  const result: HumanAudioSample[] = []
  while (result.length < count && samples.length) {
    for (const sample of shuffle(samples)) {
      if (result.length >= count) break
      if (result.at(-1)?.pinyin === sample.pinyin && samples.length > 1) continue
      result.push(sample)
    }
  }
  return result
}

function applySessionSample(sample: HumanAudioSample): void {
  selectedInitial.value = sample.initial
  selectedFinal.value = sample.final
  selectedTone.value = sample.tone
  report.value = null
  microphoneError.value = ''
  revokeRecordingUrl()
}

function startSession(): void {
  if (recording.value || analyzing.value || !samples.length) return
  const generated = buildSession(requestedCards.value)
  if (!generated.length) return

  sessionSamples.value = generated
  currentIndex.value = 0
  sessionScores.value = []
  sessionFinished.value = false
  sessionActive.value = true
  applySessionSample(generated[0])
  if (autoRepeat.value) void playReference(AUTO_REPETITIONS)
}

function nextSessionCard(): void {
  if (!sessionActive.value || !report.value) return
  sessionScores.value = [...sessionScores.value, report.value.overallScore]

  if (currentIndex.value >= sessionSamples.value.length - 1) {
    sessionActive.value = false
    sessionFinished.value = true
    return
  }

  currentIndex.value += 1
  applySessionSample(sessionSamples.value[currentIndex.value])
  if (autoRepeat.value) void playReference(AUTO_REPETITIONS)
}

function endSession(): void {
  if (recording.value) stopRecording()
  sessionActive.value = false
  sessionFinished.value = false
  sessionSamples.value = []
  currentIndex.value = 0
  sessionScores.value = []
  report.value = null
  microphoneError.value = ''
  revokeRecordingUrl()
}

function contourPoints(values: number[]): string {
  const { min, max } = chartBounds.value
  return values.map((value, index) => {
    const x = values.length === 1 ? 50 : index / (values.length - 1) * 100
    const y = 54 - (value - min) / (max - min) * 48
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function resolveReferenceUrl(audioUrl: string): string {
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl
  return `${import.meta.env.BASE_URL}${audioUrl.replace(/^\/+/, '')}`
}

async function fetchReferenceAudio(sample: HumanAudioSample): Promise<ArrayBuffer> {
  const url = resolveReferenceUrl(sample.audioUrl)
  const absoluteUrl = new URL(url, window.location.href)
  const sameOrigin = absoluteUrl.origin === window.location.origin
  const response = await fetch(absoluteUrl, {
    cache: 'force-cache',
    credentials: sameOrigin ? 'same-origin' : 'omit',
    mode: 'cors',
  })
  if (!response.ok) {
    throw new Error(`Não foi possível carregar a gravação humana de referência (HTTP ${response.status}).`)
  }
  return response.arrayBuffer()
}

async function playReference(repetitions = 1): Promise<void> {
  const sample = selectedSample.value
  if (!sample) return
  const safeRepetitions = Math.min(Math.max(Math.trunc(repetitions), 1), AUTO_REPETITIONS)
  for (let index = 0; index < safeRepetitions; index += 1) {
    await playHumanAudio(sample)
    if (index < safeRepetitions - 1 && repeatDelayMs.value > 0) await waitRepeatDelay(repeatDelayMs.value)
  }
}

async function playRecording(): Promise<void> {
  if (!recordingUrl.value) return
  const audio = new Audio(recordingUrl.value)
  await audio.play()
}

function preferredMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type))
}

function stopStream(): void {
  activeStream?.getTracks().forEach((track) => track.stop())
  activeStream = null
}

function revokeRecordingUrl(): void {
  if (recordingUrl.value) URL.revokeObjectURL(recordingUrl.value)
  recordingUrl.value = ''
}

async function analyzeBlob(blob: Blob): Promise<void> {
  const sample = selectedSample.value
  if (!sample) return
  analyzing.value = true
  report.value = null
  microphoneError.value = ''
  revokeRecordingUrl()
  recordingUrl.value = URL.createObjectURL(blob)

  try {
    const [referenceData, userData] = await Promise.all([
      fetchReferenceAudio(sample),
      blob.arrayBuffer(),
    ])
    report.value = await comparePronunciation(referenceData, userData)
  } catch (error) {
    microphoneError.value = error instanceof Error ? error.message : 'Não foi possível analisar a gravação.'
  } finally {
    analyzing.value = false
  }
}

async function startRecording(): Promise<void> {
  microphoneError.value = ''
  report.value = null

  if (!selectedSample.value) {
    microphoneError.value = 'Escolha uma sílaba que tenha gravação humana disponível.'
    return
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    microphoneError.value = 'Este navegador não oferece a captura de microfone necessária para o corretor.'
    return
  }

  try {
    activeStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    })
    chunks = []
    const mimeType = preferredMimeType()
    mediaRecorder = new MediaRecorder(activeStream, mimeType ? { mimeType } : undefined)
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) chunks.push(event.data)
    })
    mediaRecorder.addEventListener('stop', async () => {
      window.clearTimeout(stopTimer)
      recording.value = false
      const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
      stopStream()
      mediaRecorder = null
      if (!blob.size) {
        microphoneError.value = 'A gravação ficou vazia. Tente novamente.'
        return
      }
      await analyzeBlob(blob)
    }, { once: true })
    mediaRecorder.start()
    recording.value = true
    stopTimer = window.setTimeout(stopRecording, 4500)
  } catch (error) {
    stopStream()
    const name = error instanceof DOMException ? error.name : ''
    microphoneError.value = name === 'NotAllowedError'
      ? 'Permissão do microfone negada. O corretor precisa dela somente durante a gravação.'
      : 'Não foi possível acessar o microfone. Verifique a permissão do navegador.'
  }
}

function stopRecording(): void {
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
}

function reportTitle(): string {
  if (!report.value) return ''
  if (report.value.status === 'correct') return 'Muito próximo da referência.'
  if (report.value.status === 'close') return 'Quase lá: o tom está reconhecível, mas ainda há desvios.'
  return 'Precisa ajustar o contorno tonal.'
}

onBeforeUnmount(() => {
  window.clearTimeout(stopTimer)
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop()
  stopStream()
  revokeRecordingUrl()
})
</script>

<template>
  <section class="pronunciation-layout">
    <section class="trainer-card pronunciation-main">
      <div class="pronunciation-intro">
        <p class="eyebrow">Corretor local</p>
        <h2>Compare sua pronúncia com uma gravação humana</h2>
        <p>Gere uma sessão de alvos aleatórios ou pratique livremente. A quantidade e a repetição da referência seguem as Configurações.</p>
      </div>

      <div class="pronunciation-session-setup">
        <label>
          <span class="field-label">Quantidade</span>
          <select v-model.number="requestedCards" :disabled="sessionActive || recording || analyzing">
            <option v-for="quantity in quantityOptions" :key="quantity" :value="quantity">{{ quantity }} flashcards</option>
          </select>
        </label>
        <button v-if="!sessionActive" class="primary-action" type="button" :disabled="recording || analyzing || !samples.length" @click="startSession">
          Gerar flashcards de pronúncia
        </button>
        <button v-else class="secondary-record-button" type="button" :disabled="recording || analyzing" @click="endSession">
          Encerrar sessão
        </button>
      </div>

      <div v-if="sessionActive" class="pronunciation-session-progress" aria-live="polite">
        <strong>Flashcard {{ currentIndex + 1 }} de {{ sessionSamples.length }}</strong>
        <progress :value="currentIndex" :max="sessionSamples.length"></progress>
        <span>O alvo foi sorteado. Ouça a referência e tente reproduzir a sílaba.</span>
      </div>

      <div v-else-if="sessionFinished" class="pronunciation-session-summary" role="status">
        <div><span>Sessão concluída</span><strong>{{ sessionScores.length }} flashcards analisados</strong></div>
        <div><span>Média da sessão</span><strong>{{ averageSessionScore }}/100</strong></div>
        <button class="primary-action" type="button" @click="startSession">Gerar nova sessão</button>
      </div>

      <p v-if="!sessionActive" class="pronunciation-free-note">Os seletores abaixo também podem ser usados livremente fora de uma sessão.</p>

      <div class="pronunciation-selectors">
        <label><span class="field-label">Inicial</span><select v-model="selectedInitial" :disabled="recording || analyzing || sessionActive"><option v-for="initial in initialOptions" :key="initial.value || 'zero'" :value="initial.value">{{ initial.label }}</option></select></label>
        <label><span class="field-label">Final</span><select v-model="selectedFinal" :disabled="recording || analyzing || sessionActive"><option v-for="final in availableFinals" :key="final" :value="final">{{ final }}</option></select></label>
        <label><span class="field-label">Tom</span><select v-model.number="selectedTone" :disabled="recording || analyzing || sessionActive"><option v-for="tone in availableTones" :key="tone" :value="tone">{{ toneDisplay[tone].symbol }} {{ toneDisplay[tone].label }}</option></select></label>
      </div>

      <article v-if="selectedSample" class="pronunciation-target">
        <div><span>{{ sessionActive ? 'Flashcard de pronúncia' : 'Pronúncia alvo' }}</span><strong>{{ selectedSample.pinyin }}</strong><small>{{ selectedSample.hanzi || 'Sílaba isolada' }} · {{ selectedSample.speaker }}</small></div>
        <button type="button" @click="playReference()">▶ Ouvir referência</button>
      </article>

      <div class="microphone-panel">
        <div class="privacy-note"><strong>Privacidade do microfone</strong><p>O áudio é processado no seu navegador, não é enviado ao GitHub nem salvo pelo projeto. A faixa do microfone é encerrada ao terminar cada tentativa.</p></div>
        <div class="record-actions">
          <button v-if="!recording" class="record-button" type="button" :disabled="analyzing || !selectedSample" @click="startRecording">● Gravar pronúncia</button>
          <button v-else class="record-button recording" type="button" @click="stopRecording">■ Parar e analisar</button>
          <button v-if="recordingUrl && !recording" type="button" class="secondary-record-button" @click="playRecording">▶ Ouvir minha gravação</button>
        </div>
        <p v-if="recording" class="recording-status" role="status">Gravando… fale a sílaba uma vez. A gravação para automaticamente em até 4,5 segundos.</p>
        <p v-if="analyzing" class="recording-status" role="status">Analisando o contorno tonal localmente…</p>
        <p v-if="microphoneError" class="microphone-error" role="alert">{{ microphoneError }}</p>
      </div>

      <section v-if="report" class="pronunciation-report" :data-status="report.status">
        <header class="pronunciation-report-header"><div><p class="eyebrow">Resultado</p><h2>{{ reportTitle() }}</h2></div><strong class="pronunciation-score">{{ report.overallScore }}<small>/100</small></strong></header>
        <div class="pronunciation-metrics"><article><strong>{{ report.toneScore }}%</strong><span>contorno tonal</span></article><article><strong>{{ report.durationScore }}%</strong><span>ritmo/duração</span></article><article><strong>{{ report.signalScore }}%</strong><span>sinal analisável</span></article></div>
        <article class="pitch-chart"><div class="chart-title"><strong>Curva tonal normalizada</strong><span><i class="reference-dot"></i> referência humana <i class="user-dot"></i> sua voz</span></div><svg viewBox="0 0 100 60" role="img" aria-label="Comparação entre a curva tonal da referência e a curva tonal da gravação do usuário" preserveAspectRatio="none"><line x1="0" y1="30" x2="100" y2="30" class="chart-midline" /><polyline :points="contourPoints(report.referenceContour)" class="reference-line" /><polyline :points="contourPoints(report.userContour)" class="user-line" /></svg></article>
        <div class="pronunciation-segments"><article v-for="segment in report.segments" :key="segment.label" :class="segment.status"><div><strong>{{ segment.status === 'ok' ? '✓' : '△' }} {{ segment.label }}</strong><b>{{ segment.score }}%</b></div><p>{{ segment.message }}</p><small>Referência: {{ segment.referenceMovement }} · Você: {{ segment.userMovement }}</small></article></div>
        <aside class="segmental-limit-note"><strong>O que esta versão consegue corrigir?</strong><p>Ela avalia contorno do tom e duração. Ainda não classifica automaticamente se uma inicial como <b>zh</b> virou <b>z</b>, nem se uma final foi articulada incorretamente. Essa parte exige um modelo fonético específico; o site não apresenta essa conclusão sem uma medição confiável.</p></aside>
        <button v-if="sessionActive" class="pronunciation-next-card" type="button" @click="nextSessionCard">{{ currentIndex === sessionSamples.length - 1 ? 'Finalizar sessão' : 'Próximo flashcard' }}</button>
      </section>
    </section>

    <aside class="mini-dashboard pronunciation-help" aria-label="Como usar o corretor de pronúncia">
      <p class="eyebrow">Como usar</p><h2>{{ sessionActive ? 'Sessão de pronúncia' : 'Uma tentativa por vez' }}</h2>
      <ol><li>Ouça a gravação humana algumas vezes.</li><li>Grave uma única sílaba, sem falar outras palavras.</li><li>Observe onde a curva divergiu: início, meio ou final.</li><li>Repita tentando reproduzir o movimento, não a altura absoluta da voz do falante.</li></ol>
      <p class="pronunciation-help-note">A comparação normaliza a altura da voz. Uma voz grave não é penalizada por ser mais grave que a referência.</p>
    </aside>
  </section>
</template>
