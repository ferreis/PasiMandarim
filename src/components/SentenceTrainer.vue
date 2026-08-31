<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { sentencePracticeCatalog, type SentencePracticeItem, type SentenceSyllable } from '../data/generatedSentenceCatalog'
import { pinyinInitials } from '../data/pinyinMatrix'
import { toneDisplay } from '../data/toneDisplay'

type TrainingMode = 'initial' | 'final' | 'tone'
type PhraseAttempt = { mode: TrainingMode; correct: number; total: number; perfect: boolean }

const mode = ref<TrainingMode>('tone')
const requestedCards = ref(10)
const quantityOptions = [5, 10, 20]
const autoRepeat = ref(true)
const studyMode = ref(false)
const questions = ref<SentencePracticeItem[]>([])
const currentIndex = ref(0)
const answers = ref<string[]>([])
const answered = ref(false)
const revealedOnly = ref(false)
const hasPlayed = ref(false)
const audioLoading = ref(false)
const audioError = ref('')
const sessionActive = ref(false)
const sessionFinished = ref(false)
const sessionPerfect = ref(0)
const sessionCorrectSyllables = ref(0)
const sessionTotalSyllables = ref(0)
const sessionStudied = ref(0)
const studyRunning = ref(false)
const automationStatus = ref('')
const attempts = ref<PhraseAttempt[]>(loadAttempts())

let activeAudio: HTMLAudioElement | null = null
let automationGeneration = 0
const AUTO_REPETITIONS = 3
const STUDY_PAUSE_MS = 2000
const STORAGE_KEY = 'learning-mandarin:sentence-attempts:v1'
const TRUSTED_REMOTE_AUDIO_ORIGIN = 'https://audio.tatoeba.org'

const allFinals = [...new Set(pinyinInitials.flatMap((item) => item.finals))].sort((a, b) => a.localeCompare(b))
const initialOptions = pinyinInitials.map((item) => ({ value: item.value || '∅', label: item.value || '∅ — sem inicial' }))
const toneOptions = ['1', '2', '3', '4', '5']
const currentQuestion = computed(() => questions.value[currentIndex.value])
const catalogReady = computed(() => sentencePracticeCatalog.length > 0)
const modeLabel = computed(() => mode.value === 'initial' ? 'iniciais' : mode.value === 'final' ? 'finais' : 'tons')
const modeAttempts = computed(() => attempts.value.filter((item) => item.mode === mode.value))
const historyCorrect = computed(() => modeAttempts.value.reduce((sum, item) => sum + item.correct, 0))
const historyTotal = computed(() => modeAttempts.value.reduce((sum, item) => sum + item.total, 0))
const historyPrecision = computed(() => historyTotal.value ? Math.round(historyCorrect.value / historyTotal.value * 100) : 0)
const sessionPrecision = computed(() => sessionTotalSyllables.value ? Math.round(sessionCorrectSyllables.value / sessionTotalSyllables.value * 100) : 0)
const currentCorrectCount = computed(() => {
  if (!answered.value || revealedOnly.value || !currentQuestion.value) return 0
  return currentQuestion.value.syllables.filter((syllable, index) => answers.value[index] === correctValue(syllable)).length
})

watch(studyMode, (enabled) => {
  if (sessionActive.value && enabled && !studyRunning.value) void runStudyMode()
  if (!enabled && studyRunning.value) cancelAutomation()
})

function loadAttempts(): PhraseAttempt[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => ['initial', 'final', 'tone'].includes(item?.mode) && Number.isFinite(item?.correct) && Number.isFinite(item?.total)).slice(-1000)
  } catch {
    return []
  }
}

function saveAttempt(attempt: PhraseAttempt): void {
  attempts.value = [...attempts.value, attempt].slice(-1000)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts.value))
}

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

function buildQuestions(count: number): SentencePracticeItem[] {
  if (!sentencePracticeCatalog.length) return []
  const result: SentencePracticeItem[] = []
  while (result.length < count) {
    for (const item of shuffle(sentencePracticeCatalog)) {
      if (result.length >= count) break
      if (result.at(-1)?.id === item.id && sentencePracticeCatalog.length > 1) continue
      result.push(item)
    }
  }
  return result
}

function correctValue(syllable: SentenceSyllable): string {
  if (mode.value === 'initial') return syllable.initial || '∅'
  if (mode.value === 'final') return syllable.final
  return String(syllable.tone)
}

function displayValue(value: string): string {
  if (mode.value !== 'tone') return value
  const tone = Number(value) as 1 | 2 | 3 | 4 | 5
  return toneDisplay[tone] ? `${tone} ${toneDisplay[tone].symbol}` : value
}

function optionsForMode(): { value: string; label: string }[] {
  if (mode.value === 'initial') return initialOptions
  if (mode.value === 'final') return allFinals.map((value) => ({ value, label: value }))
  return toneOptions.map((value) => {
    const tone = Number(value) as 1 | 2 | 3 | 4 | 5
    return { value, label: `${value} — ${toneDisplay[tone].symbol} ${toneDisplay[tone].shortLabel}` }
  })
}

function resolveAudioUrl(source: string): string {
  if (/^https?:\/\//i.test(source)) {
    const parsed = new URL(source)
    if (parsed.protocol !== 'https:' || parsed.origin !== TRUSTED_REMOTE_AUDIO_ORIGIN) {
      throw new Error('Origem de áudio remoto não permitida.')
    }
    return parsed.href
  }

  const relative = source.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${relative}`
}

function stopAudio(): void {
  if (!activeAudio) return
  activeAudio.pause()
  activeAudio.currentTime = 0
  activeAudio = null
}

function playOnce(source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    stopAudio()
    const audio = new Audio(resolveAudioUrl(source))
    activeAudio = audio
    const cleanup = () => { if (activeAudio === audio) activeAudio = null }
    audio.addEventListener('ended', () => { cleanup(); resolve() }, { once: true })
    audio.addEventListener('error', () => { cleanup(); reject(new Error('audio')) }, { once: true })
    audio.play().catch((error) => { cleanup(); reject(error) })
  })
}

async function playCurrent(repetitions = autoRepeat.value ? AUTO_REPETITIONS : 1): Promise<void> {
  if (!currentQuestion.value || audioLoading.value) return
  audioLoading.value = true
  audioError.value = ''
  try {
    const safeRepetitions = Math.min(Math.max(repetitions, 1), 3)
    for (let index = 0; index < safeRepetitions; index += 1) await playOnce(currentQuestion.value.audio.path)
    hasPlayed.value = true
  } catch {
    audioError.value = 'Não foi possível reproduzir esta gravação humana.'
  } finally {
    audioLoading.value = false
  }
}

function wait(milliseconds: number, generation: number): Promise<boolean> {
  return new Promise((resolve) => window.setTimeout(() => resolve(generation === automationGeneration), milliseconds))
}

function cancelAutomation(): void {
  automationGeneration += 1
  studyRunning.value = false
  automationStatus.value = ''
  stopAudio()
}

function resetQuestion(): void {
  answers.value = currentQuestion.value?.syllables.map(() => '') ?? []
  answered.value = false
  revealedOnly.value = false
  hasPlayed.value = false
  audioError.value = ''
}

async function startSession(): Promise<void> {
  if (!catalogReady.value) return
  cancelAutomation()
  questions.value = buildQuestions(Math.min(requestedCards.value, Math.max(sentencePracticeCatalog.length, requestedCards.value)))
  currentIndex.value = 0
  sessionPerfect.value = 0
  sessionCorrectSyllables.value = 0
  sessionTotalSyllables.value = 0
  sessionStudied.value = 0
  sessionFinished.value = false
  sessionActive.value = true
  resetQuestion()
  if (studyMode.value) void runStudyMode()
  else if (autoRepeat.value) await playCurrent(AUTO_REPETITIONS)
}

function confirmAnswer(): void {
  const question = currentQuestion.value
  if (!question || answered.value || !hasPlayed.value || answers.value.some((value) => !value)) return
  answered.value = true
  revealedOnly.value = false
  const correct = question.syllables.filter((syllable, index) => answers.value[index] === correctValue(syllable)).length
  sessionCorrectSyllables.value += correct
  sessionTotalSyllables.value += question.syllables.length
  if (correct === question.syllables.length) sessionPerfect.value += 1
  saveAttempt({ mode: mode.value, correct, total: question.syllables.length, perfect: correct === question.syllables.length })
  if (autoRepeat.value) void playCurrent(AUTO_REPETITIONS)
}

function revealAnswer(replay = true): void {
  if (!currentQuestion.value || answered.value || !hasPlayed.value) return
  answered.value = true
  revealedOnly.value = true
  sessionStudied.value += 1
  if (replay && autoRepeat.value) void playCurrent(AUTO_REPETITIONS)
}

function moveNext(): boolean {
  if (currentIndex.value >= questions.value.length - 1) {
    sessionActive.value = false
    sessionFinished.value = true
    studyRunning.value = false
    automationStatus.value = ''
    return false
  }
  currentIndex.value += 1
  resetQuestion()
  return true
}

async function nextQuestion(): Promise<void> {
  if (!answered.value) return
  cancelAutomation()
  if (!moveNext()) return
  if (autoRepeat.value) await playCurrent(AUTO_REPETITIONS)
}

async function runStudyMode(): Promise<void> {
  if (!sessionActive.value) return
  const generation = ++automationGeneration
  studyRunning.value = true
  while (sessionActive.value && studyMode.value && generation === automationGeneration) {
    resetQuestion()
    automationStatus.value = 'Ouvindo a frase 3 vezes…'
    await playCurrent(AUTO_REPETITIONS)
    if (generation !== automationGeneration || !sessionActive.value) break
    automationStatus.value = 'Resposta em 2 segundos…'
    if (!await wait(STUDY_PAUSE_MS, generation)) break
    revealAnswer(false)
    automationStatus.value = 'Resposta exibida. Repetindo em 2 segundos…'
    if (!await wait(STUDY_PAUSE_MS, generation)) break
    automationStatus.value = 'Ouvindo novamente 3 vezes…'
    await playCurrent(AUTO_REPETITIONS)
    if (generation !== automationGeneration || !sessionActive.value) break
    automationStatus.value = 'Próxima frase em 2 segundos…'
    if (!await wait(STUDY_PAUSE_MS, generation)) break
    if (!moveNext()) break
  }
  if (generation === automationGeneration) {
    studyRunning.value = false
    automationStatus.value = ''
  }
}

function clearHistory(): void {
  if (sessionActive.value) return
  attempts.value = []
  localStorage.removeItem(STORAGE_KEY)
}

onBeforeUnmount(cancelAutomation)
</script>

<template>
  <section class="sentence-layout">
    <section class="trainer-card sentence-main">
      <div class="sentence-setup-copy">
        <p class="eyebrow">Frases</p>
        <h2>Identifique cada sílaba dentro de uma frase real</h2>
        <p>Escolha se quer treinar iniciais, finais ou tons. As frases usam gravações humanas do Tatoeba e o áudio pode tocar automaticamente três vezes.</p>
      </div>

      <div class="sentence-mode-tabs" role="radiogroup" aria-label="Tipo de identificação">
        <button v-for="item in [{value:'initial',label:'Iniciais'},{value:'final',label:'Finais'},{value:'tone',label:'Tons'}]" :key="item.value" type="button" :class="{ active: mode === item.value }" :disabled="sessionActive" @click="mode = item.value as TrainingMode">{{ item.label }}</button>
      </div>

      <div class="sentence-controls">
        <label><span class="field-label">Quantidade</span><select v-model.number="requestedCards" :disabled="sessionActive"><option v-for="quantity in quantityOptions" :key="quantity" :value="quantity">{{ quantity }} frases</option></select></label>
        <label class="sentence-check"><input v-model="autoRepeat" type="checkbox"><span><strong>Reproduzir 3× automaticamente</strong><small>Ao iniciar, avançar e revelar.</small></span></label>
        <label class="sentence-check"><input v-model="studyMode" type="checkbox"><span><strong>Modo estudo automático</strong><small>3× áudio → 2s → resposta → 2s → 3× áudio → próxima.</small></span></label>
        <button class="primary-action" type="button" :disabled="!catalogReady || sessionActive" @click="startSession">Iniciar sessão</button>
      </div>

      <p v-if="!catalogReady" class="sentence-catalog-warning">O catálogo de frases ainda não foi gerado. Execute <code>npm run phrases:sync</code>.</p>

      <div v-if="sessionActive && currentQuestion" class="sentence-question">
        <div class="tone-progress"><span>Frase {{ currentIndex + 1 }} de {{ questions.length }}</span><progress :value="currentIndex + (answered ? 1 : 0)" :max="questions.length"></progress></div>
        <div class="sentence-listen-stage">
          <span class="question-kicker">Identifique {{ modeLabel }} de {{ currentQuestion.syllables.length }} sílabas</span>
          <h2 v-if="!answered">Ouça sem olhar a resposta</h2>
          <template v-else>
            <h2 class="sentence-hanzi">{{ currentQuestion.text }}</h2>
            <p class="sentence-pinyin">{{ currentQuestion.pinyin }}</p>
            <p class="sentence-translation">{{ currentQuestion.translationPt }}</p>
          </template>
          <button class="tone-player" type="button" :disabled="audioLoading || studyRunning" @click="playCurrent()">{{ audioLoading ? 'Reproduzindo…' : hasPlayed ? '▶ Ouvir novamente' : '▶ Ouvir frase' }}</button>
          <p v-if="automationStatus" class="automation-status" role="status">{{ automationStatus }}</p>
          <button v-if="studyRunning" class="stop-study-button" type="button" @click="studyMode = false">Parar modo automático</button>
        </div>

        <div v-if="!answered && !studyRunning" class="sentence-answer-grid">
          <label v-for="(syllable, index) in currentQuestion.syllables" :key="`${currentQuestion.id}-${index}`">
            <span><b>{{ index + 1 }}ª</b> sílaba</span>
            <select v-model="answers[index]" :disabled="!hasPlayed">
              <option value="">Escolha…</option>
              <option v-for="option in optionsForMode()" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
        </div>

        <div v-if="!answered && !studyRunning" class="sentence-actions">
          <button class="primary-action" type="button" :disabled="!hasPlayed || answers.some((value) => !value)" @click="confirmAnswer">Confirmar resposta</button>
          <button type="button" :disabled="!hasPlayed" @click="revealAnswer()">Mostrar resposta</button>
        </div>

        <div v-if="answered" class="sentence-result" :class="{ study: revealedOnly }" role="status">
          <div class="sentence-result-heading">
            <strong v-if="revealedOnly">Resposta revelada.</strong>
            <strong v-else>{{ currentCorrectCount === currentQuestion.syllables.length ? 'Frase totalmente correta.' : `${currentCorrectCount} de ${currentQuestion.syllables.length} sílabas corretas.` }}</strong>
            <span v-if="revealedOnly">Esta frase não altera seu histórico de acertos.</span>
          </div>
          <div class="sentence-result-table">
            <article v-for="(syllable, index) in currentQuestion.syllables" :key="`result-${index}`">
              <b class="sentence-result-hanzi">{{ syllable.hanzi }}</b>
              <small>{{ syllable.pinyin }}</small>
              <div><span>Sua resposta</span><strong :class="!revealedOnly && answers[index] === correctValue(syllable) ? 'correct' : revealedOnly ? 'empty' : 'wrong'">{{ revealedOnly ? '—' : displayValue(answers[index]) }}</strong></div>
              <div><span>Correto</span><strong class="correct">{{ displayValue(correctValue(syllable)) }}</strong></div>
            </article>
          </div>
          <div class="sentence-source">
            <span>Voz humana: {{ currentQuestion.audio.author }} · {{ currentQuestion.audio.license }}</span>
            <a :href="currentQuestion.sourceUrl" target="_blank" rel="noreferrer">Ver frase no Tatoeba</a>
          </div>
          <button v-if="!studyRunning" type="button" @click="nextQuestion">{{ currentIndex === questions.length - 1 ? 'Finalizar sessão' : 'Próxima frase' }}</button>
        </div>
        <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>
      </div>

      <div v-if="sessionFinished" class="session-finished">
        <p class="eyebrow">Sessão concluída</p>
        <h2 v-if="sessionTotalSyllables">{{ sessionCorrectSyllables }} de {{ sessionTotalSyllables }} sílabas corretas</h2>
        <h2 v-else>{{ sessionStudied }} frases estudadas sem pontuação</h2>
        <p v-if="sessionTotalSyllables">Precisão por sílaba: {{ sessionPrecision }}%. Frases totalmente corretas: {{ sessionPerfect }}.</p>
        <p v-else>O modo de estudo não registra acerto ou erro.</p>
        <button class="primary-action" type="button" @click="startSession">Treinar novamente</button>
      </div>
    </section>

    <aside class="mini-dashboard sentence-dashboard" aria-label="Desempenho em frases">
      <p class="eyebrow">Desempenho</p>
      <h2>{{ mode === 'initial' ? 'Iniciais' : mode === 'final' ? 'Finais' : 'Tons' }}</h2>
      <section class="dashboard-section"><h3>Sessão atual</h3><div class="metric-grid compact"><article><strong>{{ sessionCorrectSyllables }}</strong><span>sílabas corretas</span></article><article><strong>{{ sessionPrecision }}%</strong><span>precisão</span></article><article><strong>{{ sessionPerfect }}</strong><span>frases perfeitas</span></article><article><strong>{{ sessionStudied }}</strong><span>apenas estudadas</span></article></div></section>
      <section class="dashboard-section"><h3>Histórico neste navegador</h3><div class="metric-grid compact"><article><strong>{{ modeAttempts.length }}</strong><span>frases respondidas</span></article><article><strong>{{ historyPrecision }}%</strong><span>precisão por sílaba</span></article></div></section>
      <button v-if="attempts.length" class="dashboard-reset" type="button" :disabled="sessionActive" @click="clearHistory">Limpar histórico de frases</button>
    </aside>
  </section>
</template>