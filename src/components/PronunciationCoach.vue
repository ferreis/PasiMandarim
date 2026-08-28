<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { generatedAudioSamples } from '../data/generatedAudioCatalog'
import { pinyinInitials } from '../data/pinyinMatrix'
import { toneDisplay } from '../data/toneDisplay'
import { playHumanAudio } from '../services/audioPlayer'
import { comparePronunciation, type PronunciationReport } from '../services/pronunciationAnalysis'
import type { HumanAudioSample, MandarinTone } from '../types/audio'

const samples = generatedAudioSamples.filter((sample) => sample.verifiedHuman && sample.localFile && sample.tone !== 5)
const initialOptions = pinyinInitials.filter((initial) => samples.some((sample) => sample.initial === initial.value))
const selectedInitial = ref(initialOptions.some((initial) => initial.value === 'b') ? 'b' : initialOptions[0]?.value ?? '')
const selectedFinal = ref('')
const selectedTone = ref<MandarinTone>(1)
const recording = ref(false)
const analyzing = ref(false)
const microphoneError = ref('')
const report = ref<PronunciationReport | null>(null)
const recordingUrl = ref('')

let mediaRecorder: MediaRecorder | null = null
let activeStream: MediaStream | null = null
let chunks: BlobPart[] = []
let stopTimer: number | undefined

const availableFinals = computed(() => [...new Set(samples.filter((sample) => sample.initial === selectedInitial.value).map((sample) => sample.final))].sort())
const availableTones = computed(() => [...new Set(samples.filter((sample) => sample.initial === selectedInitial.value && sample.final === selectedFinal.value).map((sample) => sample.tone))].sort() as MandarinTone[])
const selectedSample = computed<HumanAudioSample | undefined>(() => samples.find((sample) => sample.initial === selectedInitial.value && sample.final === selectedFinal.value && sample.tone === selectedTone.value))

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

function contourPoints(values: number[]): string {
  const { min, max } = chartBounds.value
  return values.map((value, index) => {
    const x = values.length === 1 ? 50 : index / (values.length - 1) * 100
    const y = 54 - (value - min) / (max - min) * 48
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function resolveAudioUrl(audioUrl: string): string {
  const relativePath = audioUrl.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${relativePath}`
}

async function playReference(): Promise<void> {
  if (selectedSample.value) await playHumanAudio(selectedSample.value)
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
    const referenceResponse = await fetch(resolveAudioUrl(sample.audioUrl), { cache: 'force-cache', credentials: 'same-origin' })
    if (!referenceResponse.ok) throw new Error('Não foi possível carregar a gravação humana de referência.')
    const [referenceData, userData] = await Promise.all([referenceResponse.arrayBuffer(), blob.arrayBuffer()])
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
        <p>Escolha uma sílaba, ouça a referência e grave sua tentativa. A análise compara o contorno tonal e o ritmo sem enviar sua voz para um servidor.</p>
      </div>

      <div class="pronunciation-selectors">
        <label><span class="field-label">Inicial</span><select v-model="selectedInitial" :disabled="recording || analyzing"><option v-for="initial in initialOptions" :key="initial.value || 'zero'" :value="initial.value">{{ initial.label }}</option></select></label>
        <label><span class="field-label">Final</span><select v-model="selectedFinal" :disabled="recording || analyzing"><option v-for="final in availableFinals" :key="final" :value="final">{{ final }}</option></select></label>
        <label><span class="field-label">Tom</span><select v-model.number="selectedTone" :disabled="recording || analyzing"><option v-for="tone in availableTones" :key="tone" :value="tone">{{ toneDisplay[tone].symbol }} {{ toneDisplay[tone].label }}</option></select></label>
      </div>

      <article v-if="selectedSample" class="pronunciation-target">
        <div>
          <span>Pronúncia alvo</span>
          <strong>{{ selectedSample.pinyin }}</strong>
          <small>{{ selectedSample.hanzi || 'Sílaba isolada' }} · {{ selectedSample.speaker }}</small>
        </div>
        <button type="button" @click="playReference">▶ Ouvir referência</button>
      </article>

      <div class="microphone-panel">
        <div class="privacy-note">
          <strong>Privacidade do microfone</strong>
          <p>O áudio é processado no seu navegador, não é enviado ao GitHub nem salvo pelo projeto. A faixa do microfone é encerrada ao terminar cada tentativa.</p>
        </div>
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
        <header class="pronunciation-report-header">
          <div><p class="eyebrow">Resultado</p><h2>{{ reportTitle() }}</h2></div>
          <strong class="pronunciation-score">{{ report.overallScore }}<small>/100</small></strong>
        </header>

        <div class="pronunciation-metrics">
          <article><strong>{{ report.toneScore }}%</strong><span>contorno tonal</span></article>
          <article><strong>{{ report.durationScore }}%</strong><span>ritmo/duração</span></article>
          <article><strong>{{ report.signalScore }}%</strong><span>sinal analisável</span></article>
        </div>

        <article class="pitch-chart">
          <div class="chart-title"><strong>Curva tonal normalizada</strong><span><i class="reference-dot"></i> referência humana <i class="user-dot"></i> sua voz</span></div>
          <svg viewBox="0 0 100 60" role="img" aria-label="Comparação entre a curva tonal da referência e a curva tonal da gravação do usuário" preserveAspectRatio="none">
            <line x1="0" y1="30" x2="100" y2="30" class="chart-midline" />
            <polyline :points="contourPoints(report.referenceContour)" class="reference-line" />
            <polyline :points="contourPoints(report.userContour)" class="user-line" />
          </svg>
        </article>

        <div class="pronunciation-segments">
          <article v-for="segment in report.segments" :key="segment.label" :class="segment.status">
            <div><strong>{{ segment.status === 'ok' ? '✓' : '△' }} {{ segment.label }}</strong><b>{{ segment.score }}%</b></div>
            <p>{{ segment.message }}</p>
            <small>Referência: {{ segment.referenceMovement }} · Você: {{ segment.userMovement }}</small>
          </article>
        </div>

        <aside class="segmental-limit-note">
          <strong>O que esta versão consegue corrigir?</strong>
          <p>Ela avalia contorno do tom e duração. Ainda não classifica automaticamente se uma inicial como <b>zh</b> virou <b>z</b>, nem se uma final foi articulada incorretamente. Essa parte exige um modelo fonético específico; o site não apresenta essa conclusão sem uma medição confiável.</p>
        </aside>
      </section>
    </section>

    <aside class="mini-dashboard pronunciation-help" aria-label="Como usar o corretor de pronúncia">
      <p class="eyebrow">Como usar</p>
      <h2>Uma tentativa por vez</h2>
      <ol>
        <li>Ouça a gravação humana algumas vezes.</li>
        <li>Grave uma única sílaba, sem falar outras palavras.</li>
        <li>Observe onde a curva divergiu: início, meio ou final.</li>
        <li>Repita tentando reproduzir o movimento, não a altura absoluta da voz do falante.</li>
      </ol>
      <p class="pronunciation-help-note">A comparação normaliza a altura da voz. Uma voz grave não é penalizada por ser mais grave que a referência.</p>
    </aside>
  </section>
</template>
