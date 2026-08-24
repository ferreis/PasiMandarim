<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { findHumanAudioSample, humanAudioSamples, samplesUseSameSpeaker } from './data/audioCatalog'
import { getCommonFinals, pinyinInitials } from './data/pinyinMatrix'
import { playHumanAudio } from './services/audioPlayer'
import { buildToneMarkedPinyin } from './utils/pinyin'
import type { HumanAudioSample, MandarinTone } from './types/audio'

type FlashcardSide = 'left' | 'right'

const toneLabels: Record<MandarinTone, string> = {
  1: '1º tom',
  2: '2º tom',
  3: '3º tom',
  4: '4º tom',
  5: 'Tom neutro',
}

const tones: MandarinTone[] = [1, 2, 3, 4, 5]
const initialA = ref('b')
const initialB = ref('p')
const selectedFinal = ref('ian')
const selectedTone = ref<MandarinTone>(1)
const audioError = ref('')
const loadingSide = ref<'left' | 'right' | null>(null)

const finalOptions = computed(() => getCommonFinals(initialA.value, initialB.value))

watch([initialA, initialB], () => {
  if (!finalOptions.value.includes(selectedFinal.value)) {
    selectedFinal.value = finalOptions.value[0] ?? ''
  }
  audioError.value = ''
})

const leftPinyin = computed(() =>
  selectedFinal.value
    ? buildToneMarkedPinyin(initialA.value, selectedFinal.value, selectedTone.value)
    : '—',
)

const rightPinyin = computed(() =>
  selectedFinal.value
    ? buildToneMarkedPinyin(initialB.value, selectedFinal.value, selectedTone.value)
    : '—',
)

const leftSample = computed(() =>
  selectedFinal.value
    ? findHumanAudioSample(initialA.value, selectedFinal.value, selectedTone.value)
    : undefined,
)

const rightSample = computed(() =>
  selectedFinal.value
    ? findHumanAudioSample(initialB.value, selectedFinal.value, selectedTone.value)
    : undefined,
)

const sameSpeaker = computed(() => samplesUseSameSpeaker(leftSample.value, rightSample.value))
const localAudioCount = computed(() => humanAudioSamples.filter((sample) => sample.localFile).length)
const visibleSamples = computed<HumanAudioSample[]>(() =>
  [leftSample.value, rightSample.value].filter(
    (sample): sample is HumanAudioSample => Boolean(sample),
  ),
)

const flashcardTarget = ref<FlashcardSide>('left')
const flashcardChoiceOrder = ref<FlashcardSide[]>(['left', 'right'])
const flashcardAnswer = ref<FlashcardSide | null>(null)
const flashcardHasPlayed = ref(false)
const flashcardLoading = ref(false)
const flashcardCorrect = ref(0)
const flashcardTotal = ref(0)

const flashcardReady = computed(() =>
  initialA.value !== initialB.value && Boolean(leftSample.value && rightSample.value),
)

const flashcardTargetSample = computed(() =>
  flashcardTarget.value === 'left' ? leftSample.value : rightSample.value,
)

const flashcardTargetPinyin = computed(() =>
  flashcardTarget.value === 'left' ? leftPinyin.value : rightPinyin.value,
)

const flashcardResultCorrect = computed(() =>
  flashcardAnswer.value !== null && flashcardAnswer.value === flashcardTarget.value,
)

const flashcardChoices = computed(() =>
  flashcardChoiceOrder.value.map((side) => ({
    side,
    label: side === 'left' ? 'Inicial A' : 'Inicial B',
    initial: side === 'left' ? initialA.value : initialB.value,
  })),
)

function randomBoolean(): boolean {
  const values = new Uint32Array(1)
  globalThis.crypto.getRandomValues(values)
  return (values[0] & 1) === 1
}

function newFlashcardRound(): void {
  flashcardTarget.value = randomBoolean() ? 'left' : 'right'
  flashcardChoiceOrder.value = randomBoolean() ? ['left', 'right'] : ['right', 'left']
  flashcardAnswer.value = null
  flashcardHasPlayed.value = false
  audioError.value = ''
}

watch(
  [initialA, initialB, selectedFinal, selectedTone, leftSample, rightSample],
  () => newFlashcardRound(),
  { immediate: true, flush: 'post' },
)

async function listen(sample: HumanAudioSample | undefined, side: 'left' | 'right'): Promise<void> {
  if (!sample) return

  audioError.value = ''
  loadingSide.value = side

  try {
    await playHumanAudio(sample)
  } catch {
    audioError.value = 'Não foi possível reproduzir esta gravação humana.'
  } finally {
    loadingSide.value = null
  }
}

async function playFlashcard(): Promise<void> {
  if (!flashcardReady.value || !flashcardTargetSample.value) return

  audioError.value = ''
  flashcardLoading.value = true

  try {
    await playHumanAudio(flashcardTargetSample.value)
    flashcardHasPlayed.value = true
  } catch {
    audioError.value = 'Não foi possível reproduzir o áudio desta rodada.'
  } finally {
    flashcardLoading.value = false
  }
}

function answerFlashcard(side: FlashcardSide): void {
  if (!flashcardReady.value || !flashcardHasPlayed.value || flashcardAnswer.value) return

  flashcardAnswer.value = side
  flashcardTotal.value += 1

  if (side === flashcardTarget.value) {
    flashcardCorrect.value += 1
  }
}
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">Learning Mandarin</p>
      <h1>Treino auditivo de Pinyin</h1>
      <p class="hero-copy">
        Escolha duas iniciais, uma final válida para ambas e o mesmo tom. O sistema compara apenas sílabas possíveis no mandarim.
      </p>
    </section>

    <section class="trainer-card">
      <div class="catalog-status" role="status">
        <strong>{{ humanAudioSamples.length }} gravações humanas catalogadas</strong>
        <span>{{ localAudioCount }} baixadas localmente. Nenhum TTS é usado como referência.</span>
      </div>

      <div class="controls-grid">
        <label>
          <span class="field-label">Inicial A</span>
          <select v-model="initialA">
            <option v-for="initial in pinyinInitials" :key="`a-${initial.value || 'none'}`" :value="initial.value">
              {{ initial.value ? initial.label : '∅ — sem inicial' }}
            </option>
          </select>
        </label>

        <label>
          <span class="field-label">Inicial B</span>
          <select v-model="initialB">
            <option v-for="initial in pinyinInitials" :key="`b-${initial.value || 'none'}`" :value="initial.value">
              {{ initial.value ? initial.label : '∅ — sem inicial' }}
            </option>
          </select>
        </label>

        <label>
          <span class="field-label">Final comum</span>
          <select v-model="selectedFinal" :disabled="!finalOptions.length">
            <option v-for="final in finalOptions" :key="final" :value="final">
              {{ final }}
            </option>
          </select>
        </label>

        <label>
          <span class="field-label">Tom</span>
          <select v-model.number="selectedTone">
            <option v-for="tone in tones" :key="tone" :value="tone">
              {{ toneLabels[tone] }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="!finalOptions.length" class="selection-notice">
        Essas duas iniciais não compartilham nenhuma final válida. Escolha outra combinação.
      </p>

      <div v-else class="comparison">
        <article class="sound-card">
          <span class="sound-label">Som A</span>
          <strong>{{ leftPinyin }}</strong>
          <span v-if="leftSample?.hanzi" class="hanzi">{{ leftSample.hanzi }}</span>
          <button type="button" :disabled="!leftSample" @click="listen(leftSample, 'left')">
            {{ loadingSide === 'left' ? 'Carregando…' : leftSample ? 'Ouvir' : 'Sem áudio' }}
          </button>
          <span v-if="leftSample" class="sample-origin">
            {{ leftSample.speaker }} · {{ leftSample.localFile ? 'arquivo local' : 'Wikimedia' }}
          </span>
          <span v-else class="sample-origin missing">Gravação humana ainda não catalogada</span>
          <a v-if="leftSample" :href="leftSample.sourcePage" target="_blank" rel="noreferrer">Ver fonte</a>
        </article>

        <span class="versus">×</span>

        <article class="sound-card">
          <span class="sound-label">Som B</span>
          <strong>{{ rightPinyin }}</strong>
          <span v-if="rightSample?.hanzi" class="hanzi">{{ rightSample.hanzi }}</span>
          <button type="button" :disabled="!rightSample" @click="listen(rightSample, 'right')">
            {{ loadingSide === 'right' ? 'Carregando…' : rightSample ? 'Ouvir' : 'Sem áudio' }}
          </button>
          <span v-if="rightSample" class="sample-origin">
            {{ rightSample.speaker }} · {{ rightSample.localFile ? 'arquivo local' : 'Wikimedia' }}
          </span>
          <span v-else class="sample-origin missing">Gravação humana ainda não catalogada</span>
          <a v-if="rightSample" :href="rightSample.sourcePage" target="_blank" rel="noreferrer">Ver fonte</a>
        </article>
      </div>

      <p v-if="leftSample && rightSample" class="speaker-status" :class="{ preferred: sameSpeaker }">
        {{ sameSpeaker
          ? `Comparação ideal: as duas gravações são de ${leftSample.speaker}.`
          : `Atenção: os áudios disponíveis são de falantes diferentes (${leftSample.speaker} e ${rightSample.speaker}).` }}
      </p>

      <section class="flashcard-section" aria-labelledby="flashcard-title">
        <div class="flashcard-heading">
          <div>
            <p class="eyebrow">Teste</p>
            <h2 id="flashcard-title">Flashcard auditivo</h2>
            <p>Ouça sem olhar a resposta e identifique se a gravação usa a Inicial A ou a Inicial B.</p>
          </div>
          <div class="flashcard-score" aria-label="Pontuação da sessão">
            <strong>{{ flashcardCorrect }}</strong>
            <span>acertos em {{ flashcardTotal }}</span>
          </div>
        </div>

        <p v-if="initialA === initialB" class="selection-notice">
          Escolha iniciais diferentes para iniciar o teste.
        </p>

        <p v-else-if="!leftSample || !rightSample" class="selection-notice">
          O flashcard precisa de uma gravação humana catalogada para os dois lados desta combinação.
        </p>

        <div v-else class="flashcard-card">
          <span class="flashcard-round-label">Qual inicial você ouviu?</span>

          <button class="flashcard-player" type="button" @click="playFlashcard">
            {{ flashcardLoading ? 'Carregando…' : flashcardHasPlayed ? '▶ Ouvir novamente' : '▶ Ouvir áudio' }}
          </button>

          <p v-if="!flashcardHasPlayed" class="flashcard-hint">
            Reproduza o áudio antes de responder.
          </p>

          <div class="flashcard-choices">
            <button
              v-for="choice in flashcardChoices"
              :key="choice.side"
              type="button"
              :disabled="!flashcardHasPlayed || flashcardAnswer !== null"
              :class="{
                selected: flashcardAnswer === choice.side,
                correct: flashcardAnswer !== null && flashcardTarget === choice.side,
                wrong: flashcardAnswer === choice.side && flashcardTarget !== choice.side,
              }"
              @click="answerFlashcard(choice.side)"
            >
              <span>{{ choice.label }}</span>
              <strong>{{ choice.initial || '∅' }}</strong>
            </button>
          </div>

          <div v-if="flashcardAnswer" class="flashcard-result" :class="{ correct: flashcardResultCorrect, wrong: !flashcardResultCorrect }" role="status">
            <strong>{{ flashcardResultCorrect ? 'Correto.' : 'Incorreto.' }}</strong>
            <span>
              O áudio era <b>{{ flashcardTarget === 'left' ? 'Inicial A' : 'Inicial B' }}</b>:
              {{ flashcardTargetPinyin }}.
            </span>
            <button type="button" @click="newFlashcardRound">Próxima rodada</button>
          </div>
        </div>
      </section>

      <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>

      <section v-if="visibleSamples.length" class="audio-metadata" aria-label="Origem das gravações">
        <div class="verified-badge">Gravações humanas verificadas</div>
        <div class="metadata-columns">
          <article v-for="sample in visibleSamples" :key="sample.key">
            <strong>{{ sample.pinyin }}</strong>
            <dl>
              <div><dt>Falante</dt><dd>{{ sample.speaker }}</dd></div>
              <div><dt>Origem</dt><dd>{{ sample.speakerOrigin }}</dd></div>
              <div><dt>Créditos</dt><dd>{{ sample.credits }}</dd></div>
              <div>
                <dt>Licença</dt>
                <dd><a :href="sample.license.url" target="_blank" rel="noreferrer">{{ sample.license.name }}</a></dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <p class="audio-notice">
        Execute <code>npm run audio:sync</code> para pesquisar o acervo Shtooka no Wikimedia Commons, validar os metadados e baixar diretamente todas as gravações humanas encontradas para <code>public/audio/shtooka</code>.
      </p>
    </section>
  </main>
</template>
