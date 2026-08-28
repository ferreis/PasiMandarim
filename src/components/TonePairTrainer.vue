<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { tonePairKey, tonePairWords } from '../data/tonePairCatalog'
import { toneDisplay } from '../data/toneDisplay'
import { playTonePairWord, stopTonePairAudio } from '../services/tonePairAudio'
import { clearTonePairAttempts, loadTonePairAttempts, saveTonePairAttempt } from '../services/tonePairStats'
import type { ToneNumber, TonePairAttempt, TonePairWord } from '../types/tonePair'

type FirstTone = Exclude<ToneNumber, 5>
type PairErrorSummary = { pairKey: string; attempts: number; errors: number; errorRate: number }
type DetailedAttempt = TonePairAttempt & { tone1Correct: boolean; tone2Correct: boolean }

const firstToneOptions: FirstTone[] = [1, 2, 3, 4]
const secondToneOptions: ToneNumber[] = [1, 2, 3, 4, 5]
const quantityOptions = [10, 20, 40]
const selectedFirstTones = ref<FirstTone[]>([1, 2, 3, 4])
const selectedSecondTones = ref<ToneNumber[]>([1, 2, 3, 4, 5])
const requestedCards = ref(20)
const autoRepeat = ref(true)
const studyMode = ref(false)
const questions = ref<TonePairWord[]>([])
const currentIndex = ref(0)
const answerTone1 = ref<FirstTone | null>(null)
const answerTone2 = ref<ToneNumber | null>(null)
const answered = ref(false)
const revealedOnly = ref(false)
const hasPlayed = ref(false)
const audioLoading = ref(false)
const audioError = ref('')
const sessionActive = ref(false)
const sessionFinished = ref(false)
const sessionCorrect = ref(0)
const sessionPartial = ref(0)
const sessionErrors = ref(0)
const sessionStudied = ref(0)
const studyRunning = ref(false)
const automationStatus = ref('')
const attempts = ref<TonePairAttempt[]>(loadTonePairAttempts())

let automationGeneration = 0
const AUTO_REPETITIONS = 3
const STUDY_PAUSE_MS = 2000

watch(studyMode, (enabled) => {
  if (!sessionActive.value) return

  if (enabled) {
    cancelAutomation()
    window.setTimeout(() => {
      if (studyMode.value && sessionActive.value) void runStudyMode()
    }, 0)
    return
  }

  if (studyRunning.value) {
    cancelAutomation()
    audioError.value = 'Modo automático desativado. Você pode continuar esta sessão manualmente.'
  }
})

function toneLabel(tone: ToneNumber): string {
  return toneDisplay[tone].label
}

function displayAnswer(tone: ToneNumber | null): string {
  return tone ? `${toneDisplay[tone].symbol} ${toneDisplay[tone].label}` : '—'
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
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function wait(milliseconds: number, generation: number): Promise<boolean> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(generation === automationGeneration), milliseconds)
  })
}

const activeFirstToneOptions = computed(() =>
  firstToneOptions.filter((tone) => selectedFirstTones.value.includes(tone)),
)
const activeSecondToneOptions = computed(() =>
  secondToneOptions.filter((tone) => selectedSecondTones.value.includes(tone)),
)

const candidates = computed(() => tonePairWords.filter((word) =>
  selectedFirstTones.value.includes(word.tone1) && selectedSecondTones.value.includes(word.tone2),
))

const selectedPairCount = computed(() => new Set(candidates.value.map((word) => tonePairKey(word.tone1, word.tone2))).size)

function buildQuestionSet(count: number): TonePairWord[] {
  if (!candidates.value.length) return []
  const result: TonePairWord[] = []
  while (result.length < count) {
    for (const word of shuffle(candidates.value)) {
      if (result.length >= count) break
      if (result.at(-1)?.slug === word.slug && candidates.value.length > 1) continue
      result.push(word)
    }
  }
  return result
}

const currentQuestion = computed(() => questions.value[currentIndex.value])
const answeredCount = computed(() => sessionCorrect.value + sessionPartial.value + sessionErrors.value)
const sessionAccuracy = computed(() => answeredCount.value ? Math.round(sessionCorrect.value / answeredCount.value * 100) : 0)
const scoredAnswer = computed(() => answered.value && !revealedOnly.value)
const firstToneIsCorrect = computed(() => Boolean(
  scoredAnswer.value && currentQuestion.value && answerTone1.value === currentQuestion.value.tone1,
))
const secondToneIsCorrect = computed(() => Boolean(
  scoredAnswer.value && currentQuestion.value && answerTone2.value === currentQuestion.value.tone2,
))
const answerIsCorrect = computed(() => scoredAnswer.value && firstToneIsCorrect.value && secondToneIsCorrect.value)
const answerIsPartial = computed(() => scoredAnswer.value && firstToneIsCorrect.value !== secondToneIsCorrect.value)
const resultState = computed(() => revealedOnly.value ? 'study' : answerIsCorrect.value ? 'correct' : answerIsPartial.value ? 'partial' : 'wrong')
const resultHeadline = computed(() => {
  if (revealedOnly.value) return 'Resposta revelada.'
  if (answerIsCorrect.value) return 'Correto.'
  if (answerIsPartial.value) return 'Parcialmente correto.'
  return 'Incorreto.'
})
const partialMessage = computed(() => {
  if (!answerIsPartial.value) return ''
  return firstToneIsCorrect.value ? 'Você acertou o tom da 1ª sílaba.' : 'Você acertou o tom da 2ª sílaba.'
})

const historicalCorrect = computed(() => attempts.value.filter((attempt) => attempt.correct).length)
const detailedAttempts = computed<DetailedAttempt[]>(() => attempts.value.filter(
  (attempt): attempt is DetailedAttempt => typeof attempt.tone1Correct === 'boolean' && typeof attempt.tone2Correct === 'boolean',
))
const historicalPartial = computed(() => detailedAttempts.value.filter(
  (attempt) => !attempt.correct && attempt.tone1Correct !== attempt.tone2Correct,
).length)
const historicalErrors = computed(() => attempts.value.length - historicalCorrect.value - historicalPartial.value)
const historicalAccuracy = computed(() => attempts.value.length ? Math.round(historicalCorrect.value / attempts.value.length * 100) : 0)

const syllablePerformance = computed(() => {
  const total = detailedAttempts.value.length
  const firstErrors = detailedAttempts.value.filter((attempt) => !attempt.tone1Correct).length
  const secondErrors = detailedAttempts.value.filter((attempt) => !attempt.tone2Correct).length
  return [
    { label: '1ª sílaba', attempts: total, errors: firstErrors, accuracy: total ? Math.round((total - firstErrors) / total * 100) : 0 },
    { label: '2ª sílaba', attempts: total, errors: secondErrors, accuracy: total ? Math.round((total - secondErrors) / total * 100) : 0 },
  ]
})

const worstPairs = computed<PairErrorSummary[]>(() => {
  const grouped = new Map<string, { attempts: number; errors: number }>()
  for (const attempt of attempts.value) {
    const item = grouped.get(attempt.pairKey) ?? { attempts: 0, errors: 0 }
    item.attempts += 1
    if (!attempt.correct) item.errors += 1
    grouped.set(attempt.pairKey, item)
  }
  return [...grouped.entries()].map(([pairKey, item]) => ({
    pairKey,
    attempts: item.attempts,
    errors: item.errors,
    errorRate: item.attempts ? Math.round(item.errors / item.attempts * 100) : 0,
  })).filter((item) => item.errors > 0).sort((a, b) => b.errors - a.errors || b.errorRate - a.errorRate).slice(0, 6)
})

function resetQuestionState(): void {
  answerTone1.value = null
  answerTone2.value = null
  answered.value = false
  revealedOnly.value = false
  hasPlayed.value = false
  audioError.value = ''
}

function cancelAutomation(): void {
  automationGeneration += 1
  studyRunning.value = false
  automationStatus.value = ''
  stopTonePairAudio()
}

async function playCurrent(repetitions = autoRepeat.value ? AUTO_REPETITIONS : 1): Promise<void> {
  if (!currentQuestion.value || audioLoading.value) return
  audioLoading.value = true
  audioError.value = ''
  try {
    await playTonePairWord(currentQuestion.value, repetitions)
    hasPlayed.value = true
  } catch {
    audioError.value = 'Não foi possível reproduzir esta gravação humana.'
  } finally {
    audioLoading.value = false
  }
}

function moveToNextQuestion(): boolean {
  if (currentIndex.value >= questions.value.length - 1) {
    sessionActive.value = false
    sessionFinished.value = true
    studyRunning.value = false
    automationStatus.value = ''
    return false
  }
  currentIndex.value += 1
  resetQuestionState()
  return true
}

async function startSession(): Promise<void> {
  if (!candidates.value.length) return
  cancelAutomation()
  questions.value = buildQuestionSet(requestedCards.value)
  currentIndex.value = 0
  resetQuestionState()
  sessionCorrect.value = 0
  sessionPartial.value = 0
  sessionErrors.value = 0
  sessionStudied.value = 0
  sessionFinished.value = false
  sessionActive.value = true

  if (studyMode.value) {
    void runStudyMode()
  } else if (autoRepeat.value) {
    await playCurrent(AUTO_REPETITIONS)
  }
}

function saveScoredAnswer(): void {
  const question = currentQuestion.value
  if (!question || !answerTone1.value || !answerTone2.value) return

  const tone1Correct = answerTone1.value === question.tone1
  const tone2Correct = answerTone2.value === question.tone2
  const correct = tone1Correct && tone2Correct

  if (correct) sessionCorrect.value += 1
  else if (tone1Correct !== tone2Correct) sessionPartial.value += 1
  else sessionErrors.value += 1

  attempts.value = saveTonePairAttempt({
    pairKey: tonePairKey(question.tone1, question.tone2),
    tone1: question.tone1,
    tone2: question.tone2,
    hanzi: question.hanzi,
    correct,
    answerTone1: answerTone1.value,
    answerTone2: answerTone2.value,
    tone1Correct,
    tone2Correct,
  })
}

function confirmAnswer(): void {
  if (!currentQuestion.value || !hasPlayed.value || answered.value || !answerTone1.value || !answerTone2.value) return
  revealedOnly.value = false
  answered.value = true
  saveScoredAnswer()
  if (autoRepeat.value) void playCurrent(AUTO_REPETITIONS)
}

function revealAnswer(replay = true): void {
  if (!currentQuestion.value || !hasPlayed.value || answered.value) return
  revealedOnly.value = true
  answered.value = true
  sessionStudied.value += 1
  if (replay && autoRepeat.value) void playCurrent(AUTO_REPETITIONS)
}

async function nextQuestion(): Promise<void> {
  if (!answered.value) return
  cancelAutomation()
  if (!moveToNextQuestion()) return
  if (autoRepeat.value) await playCurrent(AUTO_REPETITIONS)
}

async function runStudyMode(): Promise<void> {
  const generation = ++automationGeneration
  studyRunning.value = true

  while (sessionActive.value && studyMode.value && generation === automationGeneration) {
    resetQuestionState()
    automationStatus.value = 'Ouvindo a palavra 3 vezes…'
    await playCurrent(AUTO_REPETITIONS)
    if (generation !== automationGeneration || !sessionActive.value) break

    automationStatus.value = 'Pausa de 2 segundos antes da resposta…'
    if (!await wait(STUDY_PAUSE_MS, generation)) break

    revealAnswer(false)
    automationStatus.value = 'Resposta exibida. Repetindo em 2 segundos…'
    if (!await wait(STUDY_PAUSE_MS, generation)) break

    automationStatus.value = 'Ouvindo novamente 3 vezes…'
    await playCurrent(AUTO_REPETITIONS)
    if (generation !== automationGeneration || !sessionActive.value) break

    automationStatus.value = 'Próxima palavra em 2 segundos…'
    if (!await wait(STUDY_PAUSE_MS, generation)) break

    if (!moveToNextQuestion()) break
  }

  if (generation === automationGeneration) {
    studyRunning.value = false
    automationStatus.value = ''
  }
}

function stopStudyMode(): void {
  cancelAutomation()
  studyMode.value = false
  audioError.value = 'Modo automático interrompido. Você pode continuar esta sessão manualmente.'
}

function resetHistory(): void {
  if (!sessionActive.value) attempts.value = clearTonePairAttempts()
}

onBeforeUnmount(cancelAutomation)
</script>

<template>
  <section class="tone-pairs-layout">
    <section class="trainer-card tone-pairs-main">
      <div class="tone-setup-copy">
        <p class="eyebrow">Configuração</p>
        <h2>Escolha quais tons quer treinar</h2>
        <p>A primeira sílaba usa os tons 1–4. A segunda pode usar 1–4 ou o tom neutro. Os símbolos mostram o contorno gráfico convencional de cada tom.</p>
      </div>

      <div class="tone-selector-grid">
        <fieldset>
          <legend>Tom da 1ª sílaba</legend>
          <div class="tone-checkboxes first-tone-options">
            <label v-for="tone in firstToneOptions" :key="tone">
              <input v-model="selectedFirstTones" type="checkbox" :value="tone" :disabled="sessionActive" />
              <span class="tone-option-content">
                <strong class="tone-number">{{ tone }}</strong>
                <b class="tone-symbol">{{ toneDisplay[tone].symbol }}</b>
                <small>{{ toneDisplay[tone].shortLabel }}</small>
              </span>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Tom da 2ª sílaba</legend>
          <div class="tone-checkboxes second-tone-options">
            <label v-for="tone in secondToneOptions" :key="tone">
              <input v-model="selectedSecondTones" type="checkbox" :value="tone" :disabled="sessionActive" />
              <span class="tone-option-content">
                <strong class="tone-number">{{ tone }}</strong>
                <b class="tone-symbol">{{ toneDisplay[tone].symbol }}</b>
                <small>{{ toneDisplay[tone].shortLabel }}</small>
              </span>
            </label>
          </div>
        </fieldset>
      </div>

      <div class="tone-study-options" aria-label="Opções de reprodução">
        <label>
          <input v-model="autoRepeat" type="checkbox" />
          <span><strong>Reproduzir 3× automaticamente</strong><small>No modo manual: ao iniciar, avançar e revelar a resposta.</small></span>
        </label>
        <label>
          <input v-model="studyMode" type="checkbox" />
          <span><strong>Modo estudo automático</strong><small>Pode ser ligado ou desligado durante a sessão: 3× áudio → 2s → resposta → 2s → 3× áudio → 2s → próxima.</small></span>
        </label>
      </div>

      <div class="tone-session-row">
        <label><span class="field-label">Quantidade</span><select v-model.number="requestedCards" :disabled="sessionActive"><option v-for="quantity in quantityOptions" :key="quantity" :value="quantity">{{ quantity }} palavras</option></select></label>
        <div class="tone-selection-summary"><strong>{{ selectedPairCount }}</strong><span>pares selecionados · {{ candidates.length }} palavras</span></div>
        <button class="primary-action" type="button" :disabled="!candidates.length || sessionActive" @click="startSession">Iniciar treino</button>
      </div>
      <p v-if="!selectedFirstTones.length || !selectedSecondTones.length" class="selection-notice">Selecione pelo menos um tom para cada sílaba.</p>

      <div v-if="sessionActive && currentQuestion" class="tone-question-card">
        <div class="tone-progress"><span>Questão {{ currentIndex + 1 }} de {{ questions.length }}</span><progress :value="currentIndex + (answered ? 1 : 0)" :max="questions.length"></progress></div>
        <div class="tone-listen-stage">
          <span class="question-kicker">Identifique o par de tons</span>
          <h2 v-if="!answered">Ouça a palavra sem olhar a resposta</h2>
          <h2 v-else class="revealed-word">{{ currentQuestion.hanzi }}</h2>
          <p v-if="answered" class="revealed-pinyin">{{ currentQuestion.pinyin }} · {{ currentQuestion.meaningPt }}</p>
          <button class="tone-player" type="button" :disabled="audioLoading || studyRunning" @click="playCurrent()">{{ audioLoading ? 'Reproduzindo…' : hasPlayed ? '▶ Ouvir novamente' : '▶ Ouvir palavra' }}</button>
          <p v-if="automationStatus" class="automation-status" role="status">{{ automationStatus }}</p>
          <button v-if="studyRunning" class="stop-study-button" type="button" @click="stopStudyMode">Parar modo automático</button>
          <p v-if="!hasPlayed && !studyRunning" class="tone-hint">As respostas são liberadas depois que você ouvir o áudio.</p>
        </div>

        <div v-if="!studyMode || !studyRunning" class="tone-answer-grid" :class="{ locked: !hasPlayed }">
          <fieldset :class="{ 'syllable-correct': scoredAnswer && firstToneIsCorrect, 'syllable-wrong': scoredAnswer && !firstToneIsCorrect }">
            <legend>Tom da 1ª sílaba?</legend>
            <div class="tone-answer-buttons" :style="{ gridTemplateColumns: `repeat(${activeFirstToneOptions.length}, minmax(0, 1fr))` }">
              <button
                v-for="tone in activeFirstToneOptions"
                :key="tone"
                type="button"
                :aria-label="toneDisplay[tone].label"
                :disabled="!hasPlayed || answered"
                :class="{
                  selected: !answered && answerTone1 === tone,
                  'answer-correct': scoredAnswer && tone === currentQuestion.tone1,
                  'answer-wrong': scoredAnswer && answerTone1 === tone && tone !== currentQuestion.tone1,
                }"
                @click="answerTone1 = tone"
              >
                <strong class="tone-answer-number">{{ tone }}</strong>
                <span>{{ toneDisplay[tone].symbol }} {{ toneDisplay[tone].shortLabel }}</span>
              </button>
            </div>
          </fieldset>
          <fieldset :class="{ 'syllable-correct': scoredAnswer && secondToneIsCorrect, 'syllable-wrong': scoredAnswer && !secondToneIsCorrect }">
            <legend>Tom da 2ª sílaba?</legend>
            <div class="tone-answer-buttons" :style="{ gridTemplateColumns: `repeat(${activeSecondToneOptions.length}, minmax(0, 1fr))` }">
              <button
                v-for="tone in activeSecondToneOptions"
                :key="tone"
                type="button"
                :aria-label="toneDisplay[tone].label"
                :disabled="!hasPlayed || answered"
                :class="{
                  selected: !answered && answerTone2 === tone,
                  'answer-correct': scoredAnswer && tone === currentQuestion.tone2,
                  'answer-wrong': scoredAnswer && answerTone2 === tone && tone !== currentQuestion.tone2,
                }"
                @click="answerTone2 = tone"
              >
                <strong class="tone-answer-number">{{ tone }}</strong>
                <span>{{ toneDisplay[tone].symbol }} {{ toneDisplay[tone].shortLabel }}</span>
              </button>
            </div>
          </fieldset>
        </div>

        <div v-if="!answered && (!studyMode || !studyRunning)" class="tone-question-actions">
          <button class="confirm-tone-answer" type="button" :disabled="!hasPlayed || !answerTone1 || !answerTone2" @click="confirmAnswer">Confirmar resposta</button>
          <button class="reveal-tone-answer" type="button" :disabled="!hasPlayed" @click="revealAnswer()">Mostrar resposta</button>
        </div>

        <div v-if="answered" class="tone-result" :class="resultState" role="status">
          <div>
            <strong>{{ resultHeadline }}</strong>
            <span v-if="answerIsPartial">{{ partialMessage }}</span>
            <span v-if="revealedOnly">Esta palavra foi estudada sem registrar acerto ou erro.</span>
            <span>O par correto é <b>{{ currentQuestion.tone1 }}–{{ currentQuestion.tone2 }}</b>: {{ toneDisplay[currentQuestion.tone1].symbol }} {{ toneLabel(currentQuestion.tone1) }} + {{ toneDisplay[currentQuestion.tone2].symbol }} {{ toneLabel(currentQuestion.tone2) }}.</span>
          </div>

          <div class="tone-answer-comparison" aria-label="Comparação visual da resposta">
            <section>
              <h3>Sua resposta</h3>
              <div class="tone-result-boxes">
                <span :class="scoredAnswer ? (firstToneIsCorrect ? 'correct' : 'wrong') : 'empty'">{{ answerTone1 ?? '—' }}</span>
                <span :class="scoredAnswer ? (secondToneIsCorrect ? 'correct' : 'wrong') : 'empty'">{{ answerTone2 ?? '—' }}</span>
              </div>
              <small>{{ revealedOnly ? 'Resposta não informada.' : '1ª e 2ª sílaba.' }}</small>
            </section>
            <section>
              <h3>Resposta correta</h3>
              <div class="tone-result-boxes">
                <span class="correct">{{ currentQuestion.tone1 }}</span>
                <span class="correct">{{ currentQuestion.tone2 }}</span>
              </div>
              <small>{{ toneDisplay[currentQuestion.tone1].symbol }} {{ toneLabel(currentQuestion.tone1) }} · {{ toneDisplay[currentQuestion.tone2].symbol }} {{ toneLabel(currentQuestion.tone2) }}</small>
            </section>
          </div>

          <div v-if="scoredAnswer" class="syllable-feedback-grid">
            <article :class="firstToneIsCorrect ? 'correct' : 'wrong'">
              <strong>1ª sílaba</strong>
              <span>Sua resposta: {{ displayAnswer(answerTone1) }}</span>
              <small>{{ firstToneIsCorrect ? '✓ Você acertou esta sílaba.' : `✕ O correto era ${displayAnswer(currentQuestion.tone1)}.` }}</small>
            </article>
            <article :class="secondToneIsCorrect ? 'correct' : 'wrong'">
              <strong>2ª sílaba</strong>
              <span>Sua resposta: {{ displayAnswer(answerTone2) }}</span>
              <small>{{ secondToneIsCorrect ? '✓ Você acertou esta sílaba.' : `✕ O correto era ${displayAnswer(currentQuestion.tone2)}.` }}</small>
            </article>
          </div>

          <p v-if="currentQuestion.tone1 === 3 && currentQuestion.tone2 === 3" class="sandhi-note"><b>Regra especial 3–3:</b> na fala contínua, o primeiro 3º tom normalmente sofre sandhi e é realizado com contorno semelhante ao 2º. A resposta mostra os tons lexicais.</p>
          <button v-if="!studyRunning" type="button" @click="nextQuestion">{{ currentIndex === questions.length - 1 ? 'Finalizar sessão' : 'Próxima palavra' }}</button>
        </div>
        <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>
      </div>

      <div v-if="sessionFinished" class="session-finished tone-session-finished">
        <p class="eyebrow">Sessão concluída</p>
        <h2 v-if="answeredCount">{{ sessionCorrect }} pares totalmente corretos em {{ answeredCount }} respostas</h2>
        <h2 v-else>{{ sessionStudied }} palavras estudadas sem pontuação</h2>
        <p v-if="answeredCount">{{ sessionPartial }} respostas parciais e {{ sessionErrors }} respostas totalmente incorretas. Precisão de pares: {{ sessionAccuracy }}%. {{ sessionStudied ? `${sessionStudied} palavras também foram apenas reveladas.` : '' }} O histórico foi salvo somente neste navegador.</p>
        <p v-else>O modo estudo não altera seu histórico de acertos e erros.</p>
        <button class="primary-action" type="button" @click="startSession">Treinar novamente</button>
      </div>

      <aside class="tone-pedagogy-note">
        <strong>Como ler os símbolos?</strong>
        <p>ˉ representa o 1º tom nivelado; ˊ o 2º ascendente; ˇ o 3º baixo com mudança de direção; ˋ o 4º descendente; · representa o tom neutro contextual.</p>
      </aside>
    </section>

    <aside class="mini-dashboard tone-dashboard" aria-label="Desempenho no treino de tons">
      <div class="dashboard-title-row"><p class="eyebrow">Desempenho</p><h2>Pares tonais</h2></div>
      <section class="dashboard-section">
        <h3>Sessão atual</h3>
        <div class="metric-grid">
          <article><strong>{{ sessionCorrect }}</strong><span>acertos</span></article>
          <article><strong>{{ sessionPartial }}</strong><span>parciais</span></article>
          <article><strong>{{ sessionErrors }}</strong><span>erros completos</span></article>
          <article><strong>{{ sessionStudied }}</strong><span>apenas estudadas</span></article>
          <article><strong>{{ sessionAccuracy }}%</strong><span>precisão do par</span></article>
        </div>
      </section>
      <section class="dashboard-section">
        <h3>Histórico neste navegador</h3>
        <div class="metric-grid compact">
          <article><strong>{{ attempts.length }}</strong><span>respostas</span></article>
          <article><strong>{{ historicalAccuracy }}%</strong><span>precisão do par</span></article>
          <article><strong>{{ historicalPartial }}</strong><span>parciais</span></article>
          <article><strong>{{ historicalErrors }}</strong><span>erros completos</span></article>
        </div>
      </section>
      <section class="dashboard-section">
        <h3>Acerto por posição</h3>
        <p v-if="!detailedAttempts.length" class="dashboard-empty">As estatísticas por sílaba começam a partir das respostas registradas.</p>
        <div v-else class="syllable-performance-list">
          <article v-for="item in syllablePerformance" :key="item.label">
            <div><strong>{{ item.label }}</strong><span>{{ item.errors }} erros em {{ item.attempts }}</span></div>
            <b>{{ item.accuracy }}%</b>
          </article>
        </div>
      </section>
      <section class="dashboard-section"><h3>Pares com mais erros</h3><p v-if="!worstPairs.length" class="dashboard-empty">Ainda não há erros registrados.</p><ol v-else class="final-error-list"><li v-for="summary in worstPairs" :key="summary.pairKey"><div><strong>{{ summary.pairKey }}</strong><span>{{ summary.errors }} falhas no par em {{ summary.attempts }}</span></div><b>{{ summary.errorRate }}%</b></li></ol></section>
      <button v-if="attempts.length" class="dashboard-reset" type="button" :disabled="sessionActive" @click="resetHistory">Limpar histórico de tons</button>
    </aside>
  </section>
</template>