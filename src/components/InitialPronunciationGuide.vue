<script setup lang="ts">
import { computed } from 'vue'
import { getInitialPronunciationGuide, pronunciationReferences } from '../data/initialPronunciation'
import TonguePositionDiagram from './TonguePositionDiagram.vue'

const props = defineProps<{
  initial: string
  label: string
}>()

const guide = computed(() => getInitialPronunciationGuide(props.initial))
</script>

<template>
  <article v-if="guide" class="initial-guide" :data-initial="guide.initial">
    <header class="initial-guide-header">
      <div>
        <span class="initial-guide-label">{{ label }}</span>
        <div class="initial-guide-title-row">
          <h3>{{ guide.initial }}</h3>
          <strong>{{ guide.ipa }}</strong>
        </div>
      </div>
      <span class="initial-family">{{ guide.family }}</span>
    </header>

    <div class="initial-guide-tags" aria-label="Características fonéticas">
      <span>{{ guide.place }}</span>
      <span>{{ guide.manner }}</span>
      <span>{{ guide.aspiration }}</span>
      <span>{{ guide.voicing }}</span>
    </div>

    <div class="initial-guide-layout">
      <TonguePositionDiagram :type="guide.diagram" />

      <div class="initial-guide-copy">
        <section>
          <h4>Posição da língua</h4>
          <p>{{ guide.tongue }}</p>
        </section>
        <section>
          <h4>Lábios</h4>
          <p>{{ guide.lips }}</p>
        </section>
        <section>
          <h4>Como produzir</h4>
          <p>{{ guide.production }}</p>
        </section>
        <section>
          <h4>Erro comum</h4>
          <p>{{ guide.commonMistake }}</p>
        </section>
        <section>
          <h4>Referência para falantes de português</h4>
          <p>{{ guide.portugueseReference }}</p>
        </section>
        <section v-if="guide.contrast" class="contrast-tip">
          <h4>Contraste recomendado</h4>
          <p>{{ guide.contrast }}</p>
        </section>
      </div>
    </div>

    <footer class="initial-guide-sources">
      <span>Referências fonéticas:</span>
      <a
        v-for="reference in pronunciationReferences"
        :key="reference.url"
        :href="reference.url"
        target="_blank"
        rel="noreferrer"
      >
        {{ reference.label }}
      </a>
    </footer>
  </article>
</template>

<style scoped>
.initial-guide {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d9e0e7;
  border-radius: 18px;
  background: #fff;
}

.initial-guide-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 14px;
}

.initial-guide-label {
  color: #687784;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.initial-guide-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 4px;
}

.initial-guide-title-row h3 {
  margin: 0;
  font-size: 2.1rem;
  line-height: 1;
}

.initial-guide-title-row strong {
  color: #52606d;
  font-size: 1rem;
}

.initial-family {
  padding: 6px 9px;
  border-radius: 999px;
  background: #eef4f8;
  color: #425466;
  font-size: 0.74rem;
  font-weight: 800;
}

.initial-guide-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 0 22px 18px;
}

.initial-guide-tags span {
  padding: 5px 8px;
  border: 1px solid #d9e0e7;
  border-radius: 999px;
  color: #52606d;
  font-size: 0.72rem;
  font-weight: 700;
}

.initial-guide-layout {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
  gap: 18px;
  padding: 0 22px 20px;
}

.initial-guide-copy {
  display: grid;
  gap: 13px;
  align-content: start;
}

.initial-guide-copy section {
  min-width: 0;
}

.initial-guide-copy h4 {
  margin: 0 0 4px;
  font-size: 0.8rem;
}

.initial-guide-copy p {
  margin: 0;
  color: #52606d;
  font-size: 0.86rem;
  line-height: 1.55;
}

.contrast-tip {
  padding: 11px 12px;
  border-radius: 12px;
  background: #eef8f2;
}

.contrast-tip p {
  color: #185c37;
}

.initial-guide-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 12px;
  padding: 12px 22px 16px;
  border-top: 1px solid #e3e8ee;
  color: #7a8793;
  font-size: 0.7rem;
}

.initial-guide-sources span {
  font-weight: 800;
}

.initial-guide-sources a {
  color: #52606d;
}

@media (max-width: 650px) {
  .initial-guide-layout {
    grid-template-columns: 1fr;
  }
}
</style>
