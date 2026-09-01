<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue'
import { getCommonFinals, getPinyinInitials } from '../services/publicDataRepository'
import { useComparisonAudioFeedback, type ComparisonSide } from '../services/comparisonAudioFeedback'
import {
  buildComparisonQuestions,
  type ComparisonCandidate,
  type ComparisonQuestion,
} from '../services/comparisonQuestionGenerator'
import { flashcardSettings, resolveFlashcardTtsVoice } from '../services/flashcardSettings'
import { resolveComparisonAudio } from '../services/flashcardAudioProviders'
import {
  buildInitialPairKey,
  clearFlashcardAttemptsForPair,
  loadFlashcardAttempts,
  saveFlashcardAttempt,
  type FlashcardAttempt,
} from '../services/flashcardStats'
import { buildToneMarkedPinyin } from '../utils/pinyin'
import type { MandarinTone, PlayableAudioSample } from '../types/audio'

type FlashcardSide = ComparisonSide

const pinyinInitials = getPinyinInitials()

type FlashcardCandidate = ComparisonCandidate
type FlashcardQuestion = ComparisonQuestion

type FinalErrorSummary = {
  final: string
  attempts: number
  errors: number
  errorRate: number
}

const initialA = ref('b')
const initialB = ref('p')
const requestedCards = toRef(flashcardSettings, 'quantity')
const autoRepeat = toRef(flashcardSettings, 'autoRepeat')
const studyMode = toRef(flashcardSettings, 'studyMode')
const repeatDelayMs = toRef(flashcardSettings, 'repeatDelayMs')
const audioSource = toRef(flashcardSettings, 'audioSource')
const ttsVoice = toRef(flashcardSettings, 'ttsVoice')
const attempts = ref<FlashcardAttempt[]>(loadFlashcardAttempts())
const comparisonAudio = useComparisonAudioFeedback()

const questions = ref<FlashcardQuestion[]>([])
const currentIndex = ref(0)
const answer = ref<FlashcardSide | null>(null)
const revealedOnly = ref(false)
const hasPlayed = ref(false)
const { activeSide, error: audioError, isPlaying: audioLoading } = comparisonAudio
const sessionCorrect = ref(0)
const sessionErrors = ref(0)
const sessionStudied = ref(0)
const sessionActive = ref(false)
const sessionFinished = ref(false)
const studyRunning = ref(false)
const automationStatus = ref('')

let automationGeneration = 0
const AUTO_REPETITIONS = 3
const STUDY_PAUSE_MS = 2000

function displayInitial(initial: string): string {
  return initial || '∅'
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function waitAutomation(milliseconds: number, generation: number): Promise<boolean> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(generation === automationGeneration), milliseconds)
  })
}

const allCandidates = computed<FlashcardCandidate[]>(() => {
  if (initialA.value === initialB.value) return []

  const candidates: FlashcardCandidate[] = []

  for (const final of getCommonFinals(initialA.value, initialB.value)) {
    for (const tone of [1, 2, 3, 4, 5] as MandarinTone[]) {
      const resolved = resolveComparisonAudio(
        initialA.value, initialB.value, final, tone, audioSource.value, resolveFlashcardTtsVoice(ttsVoice.value),
      )
      if (!resolved) continue
      candidates.push({
        final,
        tone,
        ...resolved,
      })
    }
  }

  return candidates
})

const candidates = computed(() => {
  if (audioSource.value !== 'human') return allCandidates.value
  const sameSpeakerCandidates = allCandidates.value.filter((candidate) => candidate.sameSpeaker)
  return sameSpeakerCandidates.length ? sameSpeakerCandidates : allCandidates.value
})

const usesSameSpeakerOnly = computed(() =>
  candidates.value.length > 0 && candidates.value.every((candidate) => candidate.sameSpeaker),
)

function buildQuestionSet(count: number): FlashcardQuestion[] {
  return buildComparisonQuestions(candidates.value, count)
}

const currentQuestion = computed(() => questions.value[currentIndex.value])
const currentSample = computed(() => {
  const question = currentQuestion.value
  if (!question) return undefined
  return question.targetSide === 'a' ? question.sampleA : question.sampleB
})
const currentTargetInitial = computed(() =>
  currentQuestion.value?.targetSide === 'a' ? initialA.value : initialB.value,
)
const currentPinyin = computed(() => {
  const question = currentQuestion.value
  if (!question) return ''
  return buildToneMarkedPinyin(currentTargetInitial.value, question.final, question.tone)
})
const answerIsCorrect = computed(() =>
  Boolean(!revealedOnly.value && answer.value && currentQuestion.value && answer.value === currentQuestion.value.targetSide),
)
const answeredCount = computed(() => sessionCorrect.value + sessionErrors.value)
const sessionAccuracy = computed(() =>
  answeredCount.value ? Math.round((sessionCorrect.value / answeredCount.value) * 100) : 0,
)

const selectedPairKey = computed(() => buildInitialPairKey(initialA.value, initialB.value))
const pairAttempts = computed(() =>
  attempts.value.filter((attempt) => attempt.pairKey === selectedPairKey.value),
)
const historicalCorrect = computed(() => pairAttempts.value.filter((attempt) => attempt.correct).length)
const historicalErrors = computed(() => pairAttempts.value.length - historicalCorrect.value)
const historicalAccuracy = computed(() =>
  pairAttempts.value.length
    ? Math.round((historicalCorrect.value / pairAttempts.value.length) * 100)
    : 0,
)

const worstFinals = computed<FinalErrorSummary[]>(() => {
  const byFinal = new Map<string, { attempts: number; errors: number }>()

  for (const attempt of pairAttempts.value) {
    const summary = byFinal.get(attempt.final) ?? { attempts: 0, errors: 0 }
    summary.attempts += 1
    if (!attempt.correct) summary.errors += 1
    byFinal.set(attempt.final, summary)
  }

  return [...byFinal.entries()]
    .map(([final, summary]) => ({
      final,
      attempts: summary.attempts,
      errors: summary.errors,
      errorRate: summary.attempts ? Math.round((summary.errors / summary.attempts) * 100) : 0,
    }))
    .filter((summary) => summary.errors > 0)
    .sort((left, right) =>
      right.errors - left.errors || right.errorRate - left.errorRate || right.attempts - left.attempts,
    )
    .slice(0, 6)
})

function resetQuestionState(): void {
  comparisonAudio.stop()
  answer.value = null
  revealedOnly.value = false
  hasPlayed.value = false
  comparisonAudio.clearError()
}

function cancelAutomation(): void {
  automationGeneration += 1
  studyRunning.value = false
  automationStatus.value = ''
  comparisonAudio.stop()
}

async function playCurrentAudio(repetitions = 1, generation?: number): Promise<void> {
  const question = currentQuestion.value
  const sample = currentSample.value
  if (!question || !sample) return

  const safeRepetitions = Math.min(Math.max(Math.trunc(repetitions), 1), AUTO_REPETITIONS)
  for (let index = 0; index < safeRepetitions; index += 1) {
    if (generation !== undefined && generation !== automationGeneration) return
    // A pergunta é auditiva: nunca publica uma pista visual sobre a resposta.
    const completed = await comparisonAudio.playSide(question.targetSide, sample, { visualFeedback: false })
    if (!completed || (generation !== undefined && generation !== automationGeneration)) return
    if (autoRepeat.value && index < safeRepetitions - 1 && repeatDelayMs.value > 0) {
      await wait(repeatDelayMs.value)
    }
  }
  if (generation === undefined || generation === automationGeneration) hasPlayed.value = true
}

async function playContrastAudio(question: FlashcardQuestion): Promise<void> {
  // Contrasta os dois lados sem alterar a preferência de repetição automática.
  await comparisonAudio.playContrast(question.sampleA, question.sampleB, { gapMs: repeatDelayMs.value })
}

function sampleForSide(question: FlashcardQuestion, side: FlashcardSide): PlayableAudioSample {
  return side === 'a' ? question.sampleA : question.sampleB
}

function initialForSide(side: FlashcardSide): string {
  return side === 'a' ? initialA.value : initialB.value
}

function playIndividualAudio(side: FlashcardSide): void {
  const question = currentQuestion.value
  if (!question) return
  void comparisonAudio.playSide(side, sampleForSide(question, side))
}

function answerQuestion(side: FlashcardSide): void {
  const question = currentQuestion.value
  if (!question || !hasPlayed.value || answer.value || studyRunning.value) return

  answer.value = side
  revealedOnly.value = false
  const correct = side === question.targetSide

  if (correct) sessionCorrect.value += 1
  else sessionErrors.value += 1

  attempts.value = saveFlashcardAttempt({
    initialA: initialA.value,
    initialB: initialB.value,
    final: question.final,
    tone: question.tone,
    targetInitial: currentTargetInitial.value,
    correct,
  })

  // Depois de qualquer resposta, o contraste completo torna explícitos os dois lados.
  void playContrastAudio(question)
}

function revealCurrentQuestion(replay = true): void {
  const question = currentQuestion.value
  if (!question || !hasPlayed.value || answer.value) return
  revealedOnly.value = true
  answer.value = question.targetSide
  sessionStudied.value += 1
  if (replay && autoRepeat.value) void playCurrentAudio(AUTO_REPETITIONS)
}

function moveToNextQuestion(): boolean {
  if (currentIndex.value >= questions.value.length - 1) {
    sessionFinished.value = true
    sessionActive.value = false
    studyRunning.value = false
    automationStatus.value = ''
    return false
  }

  currentIndex.value += 1
  resetQuestionState()
  return true
}

async function nextQuestion(): Promise<void> {
  if (!answer.value) return
  cancelAutomation()
  if (!moveToNextQuestion()) return
  if (autoRepeat.value) await playCurrentAudio(AUTO_REPETITIONS)
}

async function runStudyMode(): Promise<void> {
  if (!sessionActive.value) return
  const generation = ++automationGeneration
  studyRunning.value = true

  while (sessionActive.value && studyMode.value && generation === automationGeneration) {
    resetQuestionState()
    automationStatus.value = 'Ouvindo o áudio 3 vezes…'
    await playCurrentAudio(AUTO_REPETITIONS, generation)
    if (generation !== automationGeneration || !sessionActive.value) break

    automationStatus.value = 'Resposta em 2 segundos…'
    if (!await waitAutomation(STUDY_PAUSE_MS, generation)) break

    revealCurrentQuestion(false)
    automationStatus.value = 'Resposta exibida. Repetindo em 2 segundos…'
    if (!await waitAutomation(STUDY_PAUSE_MS, generation)) break

    automationStatus.value = 'Ouvindo novamente 3 vezes…'
    await playCurrentAudio(AUTO_REPETITIONS, generation)
    if (generation !== automationGeneration || !sessionActive.value) break

    automationStatus.value = 'Próximo flashcard em 2 segundos…'
    if (!await waitAutomation(STUDY_PAUSE_MS, generation)) break

    if (!moveToNextQuestion()) break
  }

  if (generation === automationGeneration) {
    studyRunning.value = false
    automationStatus.value = ''
  }
}

function startSession(): void {
  if (!candidates.value.length) return

  cancelAutomation()
  questions.value = buildQuestionSet(requestedCards.value)
  currentIndex.value = 0
  resetQuestionState()
  sessionCorrect.value = 0
  sessionErrors.value = 0
  sessionStudied.value = 0
  sessionFinished.value = false
  sessionActive.value = true

  if (studyMode.value) void runStudyMode()
  else if (autoRepeat.value) void playCurrentAudio(AUTO_REPETITIONS)
}

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
    comparisonAudio.setError('Modo automático desativado. Você pode continuar esta sessão manualmente.')
  }
})

function clearPairHistory(): void {
  attempts.value = clearFlashcardAttemptsForPair(initialA.value, initialB.value)
}

onBeforeUnmount(cancelAutomation)
</script>

<template>
  <section class="flashcards-layout">
    <section class="trainer-card flashcard-main-panel">
      <div class="flashcard-setup">
        <div>
          <h2>Escolha as duas iniciais que deseja comparar</h2>
        </div>

        <div class="flashcard-setup-grid">
          <label>
            <span class="field-label">Inicial A</span>
            <select v-model="initialA" :disabled="sessionActive">
              <option v-for="initial in pinyinInitials" :key="`fa-${initial.value || 'none'}`" :value="initial.value">
                {{ initial.value ? initial.label : '∅ — sem inicial' }}
              </option>
            </select>
          </label>

          <label>
            <span class="field-label">Inicial B</span>
            <select v-model="initialB" :disabled="sessionActive">
              <option v-for="initial in pinyinInitials" :key="`fb-${initial.value || 'none'}`" :value="initial.value">
                {{ initial.value ? initial.label : '∅ — sem inicial' }}
              </option>
            </select>
          </label>

          <button class="primary-action" type="button" :disabled="!candidates.length || sessionActive" @click="startSession">
            Iniciar sessão
          </button>
        </div>

        <p v-if="initialA === initialB" class="selection-notice">Escolha duas iniciais diferentes.</p>
        <p v-else-if="!candidates.length" class="selection-notice">
          Ainda não há combinações disponíveis com a fonte de áudio selecionada para estas iniciais.
        </p>
        <p v-else class="session-source-note">
          {{ candidates.length }} combinações de final/tom disponíveis.
          {{ audioSource === 'human' && usesSameSpeakerOnly ? 'O teste usará pares gravados pelo mesmo falante.' : audioSource === 'human' ? 'Alguns pares disponíveis usam falantes diferentes.' : 'A fonte escolhida é resolvida individualmente para cada lado.' }}
        </p>
      </div>

      <div v-if="sessionActive && currentQuestion" class="flashcard-test-card">
        <div class="flashcard-progress-row">
          <span>Questão {{ currentIndex + 1 }} de {{ questions.length }}</span>
          <progress :value="currentIndex + (answer ? 1 : 0)" :max="questions.length"></progress>
        </div>

        <p class="flashcard-round-label">Qual inicial você ouviu?</p>
        <button class="flashcard-player" type="button" :disabled="studyRunning" @click="playCurrentAudio()">
          {{ audioLoading ? 'Reproduzindo…' : hasPlayed ? '▶ Ouvir novamente' : '▶ Ouvir áudio' }}
        </button>
        <p v-if="automationStatus" class="automation-status" role="status">{{ automationStatus }}</p>
        <p v-else-if="!hasPlayed" class="flashcard-hint">Ouça a gravação antes de responder.</p>

        <div v-if="!studyRunning" class="flashcard-choices">
          <div
            v-for="side in currentQuestion.answerOrder"
            :key="side"
            :class="{
              'flashcard-choice': true,
              selected: answer === side,
              correct: answer !== null && currentQuestion.targetSide === side,
              wrong: !revealedOnly && answer === side && currentQuestion.targetSide !== side,
              'is-active': answer !== null && activeSide === side,
              'is-dimmed': answer !== null && activeSide !== null && activeSide !== side,
            }"
          >
            <button
              class="flashcard-choice-answer"
              type="button"
              :disabled="!hasPlayed || answer !== null"
              @click="answerQuestion(side)"
            >
              <span>{{ side === 'a' ? 'Inicial A' : 'Inicial B' }}</span>
              <strong>{{ displayInitial(initialForSide(side)) }}</strong>
            </button>
            <button
              v-if="answer"
              class="flashcard-choice-audio"
              type="button"
              :aria-label="`Ouvir ${displayInitial(initialForSide(side))} no tom ${currentQuestion.tone === 5 ? 'neutro' : currentQuestion.tone}`"
              :aria-pressed="activeSide === side"
              @click="playIndividualAudio(side)"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M19 5a10 10 0 0 1 0 14" />
              </svg>
              <span class="visually-hidden">Ouvir {{ displayInitial(initialForSide(side)) }}</span>
            </button>
          </div>
        </div>

        <div v-if="answer" class="flashcard-result" :class="revealedOnly ? 'study' : answerIsCorrect ? 'correct' : 'wrong'" role="status">
          <strong>{{ revealedOnly ? 'Resposta revelada.' : answerIsCorrect ? 'Correto.' : 'Incorreto.' }}</strong>
          <span>
            Você ouviu <b>{{ displayInitial(currentTargetInitial) }}</b> em <b>{{ currentPinyin }}</b>.
            Final: <b>{{ currentQuestion.final }}</b> · tom {{ currentQuestion.tone === 5 ? 'neutro' : currentQuestion.tone }}.
          </span>
          <button v-if="!studyRunning" type="button" @click="nextQuestion">
            {{ currentIndex === questions.length - 1 ? 'Finalizar sessão' : 'Próximo flashcard' }}
          </button>
        </div>

        <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>
      </div>

      <div v-if="sessionFinished" class="session-finished">
        <p class="eyebrow">Sessão concluída</p>
        <h2 v-if="answeredCount">{{ sessionCorrect }} acertos em {{ answeredCount }} respostas</h2>
        <h2 v-else>{{ sessionStudied }} flashcards estudados sem pontuação</h2>
        <p v-if="answeredCount">Precisão de {{ sessionAccuracy }}%. O resultado já foi salvo neste navegador.</p>
        <p v-else>O modo de estudo não registra acerto ou erro.</p>
        <button class="primary-action" type="button" @click="startSession">Treinar novamente</button>
      </div>
    </section>

    <aside class="mini-dashboard" aria-label="Desempenho nos flashcards">
      <div class="dashboard-title-row">
        <div>
          <p class="eyebrow">Desempenho</p>
          <h2>{{ displayInitial(initialA) }} × {{ displayInitial(initialB) }}</h2>
        </div>
      </div>

      <section class="dashboard-section">
        <h3>Sessão atual</h3>
        <div class="metric-grid">
          <article><strong>{{ sessionCorrect }}</strong><span>acertos</span></article>
          <article><strong>{{ sessionErrors }}</strong><span>erros</span></article>
          <article><strong>{{ sessionAccuracy }}%</strong><span>precisão</span></article>
          <article><strong>{{ sessionStudied }}</strong><span>apenas estudados</span></article>
        </div>
      </section>

      <section class="dashboard-section">
        <h3>Histórico neste navegador</h3>
        <div class="metric-grid compact">
          <article><strong>{{ pairAttempts.length }}</strong><span>respostas</span></article>
          <article><strong>{{ historicalAccuracy }}%</strong><span>precisão</span></article>
          <article><strong>{{ historicalErrors }}</strong><span>erros</span></article>
        </div>
      </section>

      <section class="dashboard-section">
        <h3>Finais com mais erros</h3>
        <p v-if="!worstFinals.length" class="dashboard-empty">Ainda não há erros registrados para este par.</p>
        <ol v-else class="final-error-list">
          <li v-for="summary in worstFinals" :key="summary.final">
            <div>
              <strong>{{ summary.final }}</strong>
              <span>{{ summary.errors }} erros em {{ summary.attempts }}</span>
            </div>
            <b>{{ summary.errorRate }}%</b>
          </li>
        </ol>
      </section>

      <button
        v-if="pairAttempts.length"
        class="dashboard-reset"
        type="button"
        :disabled="sessionActive"
        @click="clearPairHistory"
      >
        Limpar histórico deste par
      </button>
    </aside>
  </section>
</template>
