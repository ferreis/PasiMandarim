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
import { playHumanAudio } from '../services/audioPlayer'
import { buildToneMarkedPinyin } from '../utils/pinyin'
import type { HumanAudioSample, MandarinTone } from '../types/audio'

const toneLabels: Record<MandarinTone, string> = {
  1: '1º tom',
  2: '2º tom',
  3: '3º tom',
  4: '4º tom',
  5: 'Tom neutro',
}

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
const visibleSamples = computed<HumanAudioSample[]>(() =>
  [leftSample.value, rightSample.value].filter(
    (sample): sample is HumanAudioSample => Boolean(sample),
  ),
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
        <span class="field-label">Final com áudio nos dois lados</span>
        <select v-model="selectedFinal" :disabled="!finalOptions.length">
          <option v-for="final in finalOptions" :key="final" :value="final">{{ final }}</option>
        </select>
      </label>

      <label>
        <span class="field-label">Tom disponível</span>
        <select v-model.number="selectedTone" :disabled="!toneOptions.length">
          <option v-for="tone in toneOptions" :key="tone" :value="tone">{{ toneLabels[tone] }}</option>
        </select>
      </label>
    </div>

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
      O catálogo usa apenas gravações humanas verificadas. A interface oferece somente pares com áudio disponível para os dois lados.
    </p>
  </section>
</template>
