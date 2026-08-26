<script setup lang="ts">
import InitialPronunciationGuide from './InitialPronunciationGuide.vue'
import PronunciationGlossary from './PronunciationGlossary.vue'

defineProps<{
  initialA: string
  initialB: string
}>()
</script>

<template>
  <section v-if="initialA || initialB" class="initial-guides-section" aria-labelledby="initial-guides-title">
    <div class="initial-guides-heading">
      <div>
        <p class="eyebrow">Guia de articulação</p>
        <h2 id="initial-guides-title">Como produzir as iniciais selecionadas</h2>
      </div>
      <p>
        Use a gravação humana como referência principal. O desenho mostra a anatomia e destaca a região aproximada onde a articulação acontece.
      </p>
    </div>

    <PronunciationGlossary />

    <div class="initial-guides-grid">
      <InitialPronunciationGuide v-if="initialA" :initial="initialA" label="Inicial A" />
      <InitialPronunciationGuide v-if="initialB" :initial="initialB" label="Inicial B" />
    </div>
  </section>
</template>

<style scoped>
.initial-guides-section {
  display: grid;
  gap: 18px;
  margin-top: 30px;
  padding-top: 28px;
  border-top: 1px solid #d9e0e7;
}

.initial-guides-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.initial-guides-heading .eyebrow {
  margin: 0 0 5px;
}

.initial-guides-heading h2 {
  margin: 0;
  font-size: clamp(1.35rem, 2vw, 1.75rem);
}

.initial-guides-heading > p {
  max-width: 620px;
  margin: 0;
  color: #687784;
  font-size: 0.86rem;
  line-height: 1.55;
}

.initial-guides-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 1050px) {
  .initial-guides-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .initial-guides-heading {
    align-items: start;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
