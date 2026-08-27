<script setup lang="ts">
import { computed, ref } from 'vue'
import { tonePairKey, tonePairWords } from '../data/tonePairCatalog'
import { playTonePairWord } from '../services/tonePairAudio'
import { clearTonePairAttempts, loadTonePairAttempts, saveTonePairAttempt } from '../services/tonePairStats'
import type { ToneNumber, TonePairAttempt, TonePairWord } from '../types/tonePair'

type FirstTone = Exclude<ToneNumber, 5>
type PairErrorSummary = { pairKey: string; attempts: number; errors: number; errorRate: number }

const firstToneOptions: FirstTone[] = [1, 2, 3, 4]
const secondToneOptions: ToneNumber[] = [1, 2, 3, 4, 5]
const quantityOptions = [10, 20, 40]
const selectedFirstTones = ref<FirstTone[]>([1, 2, 3, 4])
const selectedSecondTones = ref<ToneNumber[]>([1, 2, 3, 4, 5])
const requestedCards = ref(20)
const questions = ref<TonePairWord[]>([])
const currentIndex = ref(0)
const answerTone1 = ref<FirstTone | null>(null)
const answerTone2 = ref<ToneNumber | null>(null)
const answered = ref(false)
const hasPlayed = ref(false)
const audioLoading = ref(false)
const audioError = ref('')
const sessionActive = ref(false)
const sessionFinished = ref(false)
const sessionCorrect = ref(0)
const sessionErrors = ref(0)
const attempts = ref<TonePairAttempt[]>(loadTonePairAttempts())

function toneLabel(tone: ToneNumber): string {
  return tone === 5 ? 'Tom neutro' : `${tone}º tom`
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
const answeredCount = computed(() => sessionCorrect.value + sessionErrors.value)
const sessionAccuracy = computed(() => answeredCount.value ? Math.round(sessionCorrect.value / answeredCount.value * 100) : 0)
const answerIsCorrect = computed(() => Boolean(currentQuestion.value && answerTone1.value === currentQuestion.value.tone1 && answerTone2.value === currentQuestion.value.tone2))
const historicalCorrect = computed(() => attempts.value.filter((attempt) => attempt.correct).length)
const historicalErrors = computed(() => attempts.value.length - historicalCorrect.value)
const historicalAccuracy = computed(() => attempts.value.length ? Math.round(historicalCorrect.value / attempts.value.length * 100) : 0)

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

function startSession(): void {
  if (!candidates.value.length) return
  questions.value = buildQuestionSet(requestedCards.value)
  currentIndex.value = 0
  answerTone1.value = null
  answerTone2.value = null
  answered.value = false
  hasPlayed.value = false
  audioError.value = ''
  sessionCorrect.value = 0
  sessionErrors.value = 0
  sessionFinished.value = false
  sessionActive.value = true
}

async function playCurrent(): Promise<void> {
  if (!currentQuestion.value) return
  audioLoading.value = true
  audioError.value = ''
  try {
    await playTonePairWord(currentQuestion.value)
    hasPlayed.value = true
  } catch {
    audioError.value = 'Não foi possível reproduzir esta gravação humana.'
  } finally {
    audioLoading.value = false
  }
}

function confirmAnswer(): void {
  const question = currentQuestion.value
  if (!question || !hasPlayed.value || answered.value || !answerTone1.value || !answerTone2.value) return
  answered.value = true
  const correct = answerTone1.value === question.tone1 && answerTone2.value === question.tone2
  if (correct) sessionCorrect.value += 1
  else sessionErrors.value += 1
  attempts.value = saveTonePairAttempt({ pairKey: tonePairKey(question.tone1, question.tone2), tone1: question.tone1, tone2: question.tone2, hanzi: question.hanzi, correct })
}

function nextQuestion(): void {
  if (!answered.value) return
  if (currentIndex.value >= questions.value.length - 1) {
    sessionActive.value = false
    sessionFinished.value = true
    return
  }
  currentIndex.value += 1
  answerTone1.value = null
  answerTone2.value = null
  answered.value = false
  hasPlayed.value = false
  audioError.value = ''
}

function resetHistory(): void {
  if (!sessionActive.value) attempts.value = clearTonePairAttempts()
}
</script>

<template>
  <section class="tone-pairs-layout">
    <section class="trainer-card tone-pairs-main">
      <div class="tone-setup-copy">
        <p class="eyebrow">Configuração</p>
        <h2>Escolha quais tons quer treinar</h2>
        <p>A primeira sílaba usa os tons 1–4. A segunda pode usar 1–4 ou o tom neutro. As opções marcadas são combinadas e as palavras são sorteadas.</p>
      </div>

      <div class="tone-selector-grid">
        <fieldset>
          <legend>Tom da 1ª sílaba</legend>
          <div class="tone-checkboxes first-tone-options">
            <label v-for="tone in firstToneOptions" :key="tone">
              <input v-model="selectedFirstTones" type="checkbox" :value="tone" :disabled="sessionActive" />
              <span>{{ tone }}º</span>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Tom da 2ª sílaba</legend>
          <div class="tone-checkboxes second-tone-options">
            <label v-for="tone in secondToneOptions" :key="tone">
              <input v-model="selectedSecondTones" type="checkbox" :value="tone" :disabled="sessionActive" />
              <span>{{ toneLabel(tone) }}</span>
            </label>
          </div>
        </fieldset>
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
          <button class="tone-player" type="button" @click="playCurrent">{{ audioLoading ? 'Carregando…' : hasPlayed ? '▶ Ouvir novamente' : '▶ Ouvir palavra' }}</button>
          <p v-if="!hasPlayed" class="tone-hint">As respostas são liberadas depois que você ouvir o áudio.</p>
        </div>

        <div class="tone-answer-grid" :class="{ locked: !hasPlayed || answered }">
          <fieldset><legend>Tom da 1ª sílaba?</legend><div class="tone-answer-buttons four"><button v-for="tone in firstToneOptions" :key="tone" type="button" :disabled="!hasPlayed || answered" :class="{ selected: answerTone1 === tone }" @click="answerTone1 = tone">{{ tone }}º</button></div></fieldset>
          <fieldset><legend>Tom da 2ª sílaba?</legend><div class="tone-answer-buttons five"><button v-for="tone in secondToneOptions" :key="tone" type="button" :disabled="!hasPlayed || answered" :class="{ selected: answerTone2 === tone }" @click="answerTone2 = tone">{{ tone === 5 ? 'Neutro' : `${tone}º` }}</button></div></fieldset>
        </div>
        <button v-if="!answered" class="confirm-tone-answer" type="button" :disabled="!hasPlayed || !answerTone1 || !answerTone2" @click="confirmAnswer">Confirmar resposta</button>

        <div v-else class="tone-result" :class="answerIsCorrect ? 'correct' : 'wrong'" role="status">
          <div><strong>{{ answerIsCorrect ? 'Correto.' : 'Incorreto.' }}</strong><span>O par é <b>{{ currentQuestion.tone1 }}–{{ currentQuestion.tone2 }}</b>: {{ toneLabel(currentQuestion.tone1) }} + {{ toneLabel(currentQuestion.tone2) }}.</span></div>
          <p v-if="currentQuestion.tone1 === 3 && currentQuestion.tone2 === 3" class="sandhi-note"><b>Regra especial 3–3:</b> na fala contínua, o primeiro 3º tom normalmente sofre sandhi e é realizado com contorno semelhante ao 2º. A resposta mostra os tons lexicais.</p>
          <button type="button" @click="nextQuestion">{{ currentIndex === questions.length - 1 ? 'Finalizar sessão' : 'Próxima palavra' }}</button>
        </div>
        <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>
      </div>

      <div v-if="sessionFinished" class="session-finished tone-session-finished">
        <p class="eyebrow">Sessão concluída</p><h2>{{ sessionCorrect }} acertos em {{ questions.length }}</h2><p>Precisão de {{ sessionAccuracy }}%. O histórico foi salvo somente neste navegador.</p><button class="primary-action" type="button" @click="startSession">Treinar novamente</button>
      </div>

      <aside class="tone-pedagogy-note"><strong>Por que 4 × 5?</strong><p>São quatro possibilidades lexicais na primeira sílaba e cinco na segunda quando incluímos o tom neutro, totalizando 20 pares. Mudanças tonais como o sandhi do 3º tom continuam existindo na fala natural.</p></aside>
    </section>

    <aside class="mini-dashboard tone-dashboard" aria-label="Desempenho no treino de tons">
      <div class="dashboard-title-row"><p class="eyebrow">Desempenho</p><h2>Pares tonais</h2></div>
      <section class="dashboard-section"><h3>Sessão atual</h3><div class="metric-grid"><article><strong>{{ sessionCorrect }}</strong><span>acertos</span></article><article><strong>{{ sessionErrors }}</strong><span>erros</span></article><article><strong>{{ sessionAccuracy }}%</strong><span>precisão</span></article><article><strong>{{ answeredCount }}</strong><span>respondidas</span></article></div></section>
      <section class="dashboard-section"><h3>Histórico neste navegador</h3><div class="metric-grid compact"><article><strong>{{ attempts.length }}</strong><span>respostas</span></article><article><strong>{{ historicalAccuracy }}%</strong><span>precisão</span></article><article><strong>{{ historicalErrors }}</strong><span>erros</span></article></div></section>
      <section class="dashboard-section"><h3>Pares com mais erros</h3><p v-if="!worstPairs.length" class="dashboard-empty">Ainda não há erros registrados.</p><ol v-else class="final-error-list"><li v-for="summary in worstPairs" :key="summary.pairKey"><div><strong>{{ summary.pairKey }}</strong><span>{{ summary.errors }} erros em {{ summary.attempts }}</span></div><b>{{ summary.errorRate }}%</b></li></ol></section>
      <button v-if="attempts.length" class="dashboard-reset" type="button" :disabled="sessionActive" @click="resetHistory">Limpar histórico de tons</button>
    </aside>
  </section>
</template>
