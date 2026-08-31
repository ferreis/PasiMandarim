<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import FlashcardTrainer from './FlashcardTrainer.vue'

const TonePairTrainer = defineAsyncComponent(() => import('./TonePairTrainer.vue'))
const SentenceTrainer = defineAsyncComponent(() => import('./SentenceTrainer.vue'))
const PronunciationCoach = defineAsyncComponent(() => import('./PronunciationCoach.vue'))
const FlashcardSettings = defineAsyncComponent(() => import('./FlashcardSettings.vue'))

type FlashcardCategory = 'comparison' | 'tones' | 'sentences' | 'pronunciation' | 'settings'

defineProps<{
  activeCategory: FlashcardCategory
}>()

const categories: { id: FlashcardCategory; label: string; description: string; href: string }[] = [
  {
    id: 'comparison',
    label: 'Comparação',
    description: 'Identifique qual das duas iniciais foi pronunciada.',
    href: '#/flashcards/comparison',
  },
  {
    id: 'tones',
    label: 'Tons',
    description: 'Identifique os tons de palavras humanas de duas sílabas.',
    href: '#/flashcards/tones',
  },
  {
    id: 'sentences',
    label: 'Frases',
    description: 'Treine iniciais, finais ou tons em cada sílaba de uma frase.',
    href: '#/flashcards/sentences',
  },
  {
    id: 'pronunciation',
    label: 'Pronúncia',
    description: 'Gere alvos e compare sua voz com gravações humanas.',
    href: '#/flashcards/pronunciation',
  },
  {
    id: 'settings',
    label: 'Configurações',
    description: 'Defina quantidade, repetição automática, intervalo e modo estudo.',
    href: '#/flashcards/settings',
  },
]
</script>

<template>
  <section class="flashcard-hub">
    <section class="flashcard-category-panel" aria-labelledby="flashcard-category-title">
      <div class="flashcard-category-heading">
        <div>
          <p class="eyebrow">Tipo de exercício</p>
          <h2 id="flashcard-category-title">Escolha a categoria dos flashcards</h2>
        </div>
        <p>Você pode trocar de categoria a qualquer momento. As configurações gerais e os históricos ficam salvos somente neste navegador.</p>
      </div>

      <nav class="flashcard-category-nav" aria-label="Categorias de flashcards">
        <a
          v-for="category in categories"
          :key="category.id"
          :href="category.href"
          :class="{ active: activeCategory === category.id }"
          :aria-current="activeCategory === category.id ? 'page' : undefined"
        >
          <strong>{{ category.label }}</strong>
          <span>{{ category.description }}</span>
        </a>
      </nav>
    </section>

    <FlashcardTrainer v-if="activeCategory === 'comparison'" />
    <TonePairTrainer v-else-if="activeCategory === 'tones'" />
    <SentenceTrainer v-else-if="activeCategory === 'sentences'" />
    <PronunciationCoach v-else-if="activeCategory === 'pronunciation'" />
    <FlashcardSettings v-else />
  </section>
</template>

<style scoped>
.flashcard-hub{display:grid;gap:22px}.flashcard-category-panel{padding:22px;border:1px solid #d9e0e7;border-radius:20px;background:#fff;box-shadow:0 16px 38px rgba(37,52,66,.05)}.flashcard-category-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:18px}.flashcard-category-heading h2{margin:3px 0 0;font-size:clamp(1.25rem,2vw,1.65rem)}.flashcard-category-heading>p{max-width:610px;margin:0;color:#62707d;line-height:1.55}.flashcard-category-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.flashcard-category-nav a{display:grid;gap:5px;min-height:104px;padding:16px;border:1px solid #d9e0e7;border-radius:15px;background:#f8fafb;color:#17202a;text-decoration:none;transition:border-color 140ms ease,background 140ms ease,transform 140ms ease}.flashcard-category-nav a:hover{transform:translateY(-2px);border-color:#aab7c3;background:#fff}.flashcard-category-nav a.active{border-color:#17202a;background:#17202a;color:#fff}.flashcard-category-nav strong{font-size:1rem}.flashcard-category-nav span{color:#62707d;font-size:.82rem;line-height:1.45}.flashcard-category-nav a.active span{color:#d8e1e8}.flashcard-category-nav a:focus-visible{outline:3px solid rgba(23,32,42,.22);outline-offset:2px}@media(max-width:1100px){.flashcard-category-nav{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:960px){.flashcard-category-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.flashcard-category-heading{align-items:flex-start;flex-direction:column;gap:8px}}@media(max-width:560px){.flashcard-category-panel{padding:16px}.flashcard-category-nav{grid-template-columns:1fr}.flashcard-category-nav a{min-height:auto}}
</style>
