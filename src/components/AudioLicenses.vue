<script setup lang="ts">
const audioSources = [
  {
    name: 'Audio-cmn — sílabas de mandarim',
    speaker: 'Chen Wang',
    description: 'Gravações humanas de sílabas usadas como fonte principal do treinador.',
    license: 'CC BY-SA (conforme acervo original)',
    sourceUrl: 'https://github.com/hugolpz/audio-cmn',
  },
  {
    name: 'Shtooka / Wikimedia Commons',
    speaker: 'Wei Gao',
    description: 'Gravações humanas usadas como fonte complementar quando necessário.',
    license: 'CC BY 2.0 FR',
    sourceUrl: 'https://commons.wikimedia.org/wiki/Category:Shtooka_Project',
  },
]
</script>

<template>
  <section class="audio-license-footer" aria-labelledby="audio-license-title">
    <div class="footer-section-heading">
      <span class="footer-kicker">Áudios de referência</span>
      <h2 id="audio-license-title">Licenças e créditos</h2>
      <p>
        O Learning Mandarin utiliza somente gravações humanas verificadas. Os áudios permanecem
        sujeitos às licenças e aos créditos dos respectivos acervos de origem.
      </p>
    </div>

    <div class="license-grid">
      <article v-for="source in audioSources" :key="source.name" class="license-card">
        <strong>{{ source.name }}</strong>
        <span>Falante: {{ source.speaker }}</span>
        <p>{{ source.description }}</p>
        <a :href="source.sourceUrl" target="_blank" rel="noreferrer">
          {{ source.license }} · ver fonte original
        </a>
      </article>
    </div>
  </section>
</template>
