<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { findHumanAudioSample, humanAudioSamples, samplesUseSameSpeaker } from './data/audioCatalog'
import { getCommonFinals, pinyinInitials } from './data/pinyinMatrix'
import { playHumanAudio } from './services/audioPlayer'
import { buildToneMarkedPinyin } from './utils/pinyin'
import type { HumanAudioSample, MandarinTone } from './types/audio'

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

      <p v-if="audioError" class="audio-error" role="alert">{{ audioError }}</p>

      <section v-if="leftSample || rightSample" class="audio-metadata" aria-label="Origem das gravações">
        <div class="verified-badge">Gravações humanas verificadas</div>
        <div class="metadata-columns">
          <article v-for="sample in [leftSample, rightSample].filter(Boolean)" :key="sample!.key">
            <strong>{{ sample!.pinyin }}</strong>
            <dl>
              <div><dt>Falante</dt><dd>{{ sample!.speaker }}</dd></div>
              <div><dt>Origem</dt><dd>{{ sample!.speakerOrigin }}</dd></div>
              <div><dt>Créditos</dt><dd>{{ sample!.credits }}</dd></div>
              <div>
                <dt>Licença</dt>
                <dd><a :href="sample!.license.url" target="_blank" rel="noreferrer">{{ sample!.license.name }}</a></dd>
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
