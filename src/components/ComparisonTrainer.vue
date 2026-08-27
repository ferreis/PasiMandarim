<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  findHumanAudioSample,
  getAvailableTonesForPair,
  getPlayableFinalsForPair,
  humanAudioSamples,
  samplesUseSameSpeaker,
} from '../data/audioCatalog'
import { getCommonFinals, pinyinInitials } from '../data/pinyinMatrix'
import { mandarinTones, toneDisplay, toneText } from '../data/toneDisplay'
import { playHumanAudio } from '../services/audioPlayer'
import { buildToneMarkedPinyin } from '../utils/pinyin'
import type { HumanAudioSample, MandarinTone } from '../types/audio'
import InitialPronunciationPair from './InitialPronunciationPair.vue'

const initialA = ref('b')
const initialB = ref('p')
const selectedFinal = ref('ian')
const selectedTone = ref<MandarinTone>(1)
const audioError = ref('')
const loadingSide = ref<'left' | 'right' | null>(null)

const theoreticalCombinationCount = pinyinInitials.reduce(
  (total, initial) => total + initial.finals.length * 5,
  0,
)
const catalogCoverage = Math.round((humanAudioSamples.length / theoreticalCombinationCount) * 100)
const localAudioCount = computed(() => humanAudioSamples.filter((sample) => sample.localFile).length)

const commonFinalOptions = computed(() => getCommonFinals(initialA.value, initialB.value))
const finalOptions = computed(() =>
  getPlayableFinalsForPair(initialA.value, initialB.value, commonFinalOptions.value),
)
const toneOptions = computed(() =>
  selectedFinal.value
    ? getAvailableTonesForPair(initialA.value, initialB.value, selectedFinal.value)
    : [],
)
const neutralToneAvailable = computed(() => toneOptions.value.includes(5))

function normalizeSelection(): void {
  if (!finalOptions.value.includes(selectedFinal.value)) {
    selectedFinal.value = finalOptions.value[0] ?? ''
  }

  if (!toneOptions.value.includes(selectedTone.value)) {
    selectedTone.value = toneOptions.value[0] ?? 1
  }

  audioError.value = ''
}

watch([initialA, initialB], normalizeSelection, { flush: 'sync' })
watch(selectedFinal, normalizeSelection, { flush: 'sync' })

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
</script>

<template>
  <section class="trainer-card">
    <div class="catalog-status" role="status">
      <strong>{{ humanAudioSamples.length }} gravações humanas catalogadas</strong>
      <span>
        {{ localAudioCount }} locais · cobertura atual de {{ catalogCoverage }}% da matriz teórica de sílaba/tom.
      </span>
    </div>

    <div class="controls-grid">
      <label>
        <span class="field-label">Inicial A</span>
        <select v-model="initialA" aria-label="Inicial A">
          <option v-for="initial in pinyinInitials" :key="`a-${initial.value || 'none'}`" :value="initial.value">
            {{ initial.value ? initial.label : '∅ — sem inicial' }}
          </option>
        </select>
      </label>

      <label>
        <span class="field-label">Inicial B</span>
        <select v-model="initialB" aria-label="Inicial B">
          <option v-for="initial in pinyinInitials" :key="`b-${initial.value || 'none'}`" :value="initial.value">
            {{ initial.value ? initial.label : '∅ — sem inicial' }}
          </option>
        </select>
      </label>

      <label>
        <span class="field-label">Final com áudio nos dois lados</span>
        <select v-model="selectedFinal" :disabled="!finalOptions.length">
          <option v-for="final in finalOptions" :key="final" :value="final">{{ final }}</option>
        </select>
      </label>

      <label>
        <span class="field-label">Tom</span>
        <select v-model.number="selectedTone" :disabled="!toneOptions.length" aria-label="Tom da comparação">
          <option
            v-for="tone in mandarinTones"
            :key="tone"
            :value="tone"
            :disabled="!toneOptions.includes(tone)"
          >
            {{ toneText(tone) }}{{ toneOptions.includes(tone) ? '' : ' — sem áudio neste par' }}
          </option>
        </select>
        <span class="tone-select-help">
          {{ toneDisplay[selectedTone].symbol }} {{ toneDisplay[selectedTone].explanation }}
        </span>
      </label>
    </div>

    <p v-if="!neutralToneAvailable && finalOptions.length" class="neutral-tone-note">
      <strong>· Tom neutro:</strong> ele é contextual e normalmente ocorre em sílabas átonas dentro de palavras.
      O acervo de sílabas isoladas não possui uma gravação neutra confiável para este par; por isso ele aparece desabilitado aqui.
      Na área <a href="#/tones">Tons</a>, o neutro é treinado dentro de palavras humanas reais.
    </p>

    <p v-if="!commonFinalOptions.length" class="selection-notice">
      Essas duas iniciais não compartilham nenhuma final válida no Pinyin.
    </p>
    <p v-else-if="!finalOptions.length" class="selection-notice">
      Essas iniciais compartilham finais válidas, mas ainda não existe um mesmo tom com gravação humana catalogada para os dois lados.
    </p>

    <div v-else-if="leftSample && rightSample" class="comparison">
      <article class="sound-card">
        <span class="sound-label">Som A</span>
        <strong>{{ leftPinyin }}</strong>
        <span v-if="leftSample.hanzi" class="hanzi">{{ leftSample.hanzi }}</span>
        <button type="button" @click="listen(leftSample, 'left')">
          {{ loadingSide === 'left' ? 'Carregando…' : 'Ouvir' }}
        </button>
        <span class="sample-origin">
          {{ leftSample.speaker }} · {{ leftSample.localFile ? 'arquivo local' : 'remoto' }}
        </span>
        <a :href="leftSample.sourcePage" target="_blank" rel="noreferrer">Ver fonte</a>
      </article>

      <span class="versus">×</span>

      <article class="sound-card">
        <span class="sound-label">Som B</span>
        <strong>{{ rightPinyin }}</strong>
        <span v-if="rightSample.hanzi" class="hanzi">{{ rightSample.hanzi }}</span>
        <button type="button" @click="listen(rightSample, 'right')">
          {{ loadingSide === 'right' ? 'Carregando…' : 'Ouvir' }}
        </button>
        <span class="sample-origin">
          {{ rightSample.speaker }} · {{ rightSample.localFile ? 'arquivo local' : 'remoto' }}
        </span>
        <a :href="rightSample.sourcePage" target="_blank" rel="noreferrer">Ver fonte</a>
      </article>
    </div>

    <p v-if="leftSample && rightSample" class="speaker-status" :class="{ preferred: sameSpeaker }">
      {{ sameSpeaker
        ? `Comparação ideal: as duas gravações são de ${leftSample.speaker}.`
        : `Atenção: os áudios disponíveis são de falantes diferentes (${leftSample.speaker} e ${rightSample.speaker}).` }}
    </p>

    <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>

    <p class="audio-notice">
      O catálogo usa apenas gravações humanas verificadas. A interface oferece somente pares com áudio disponível para os dois lados. Créditos e licenças estão disponíveis no rodapé.
    </p>

    <InitialPronunciationPair :initial-a="initialA" :initial-b="initialB" />
  </section>
</template>
