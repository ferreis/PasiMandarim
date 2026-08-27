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
  {
    name: 'Sinosplice — Mandarin Chinese Tone Pair Drills',
    speaker: 'Gravações humanas do acervo Sinosplice',
    description: 'Palavras reais de duas sílabas usadas no treino de identificação dos 20 pares tonais.',
    license: 'CC BY-NC-SA 2.5',
    sourceUrl: 'https://www.sinosplice.com/learn-chinese/tone-pair-drills',
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

<style scoped>
.audio-license-footer {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.6fr);
  gap: 32px;
  padding: 30px 0;
  border-bottom: 1px solid #d9e0e7;
}

.footer-section-heading h2 {
  margin: 6px 0 0;
  font-size: 1.25rem;
}

.footer-section-heading p {
  margin: 10px 0 0;
  color: #687784;
  line-height: 1.6;
}

.footer-kicker {
  color: #52606d;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.license-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.license-card {
  display: grid;
  align-content: start;
  gap: 7px;
  padding: 18px;
  border: 1px solid #dfe5eb;
  border-radius: 14px;
  background: #fff;
}

.license-card > strong {
  color: #17202a;
  font-size: 0.96rem;
}

.license-card > span {
  color: #687784;
  font-size: 0.84rem;
}

.license-card p {
  margin: 2px 0;
  color: #52606d;
  font-size: 0.86rem;
  line-height: 1.5;
}

.license-card a {
  color: #17202a;
  font-size: 0.84rem;
  font-weight: 700;
}

@media (max-width: 760px) {
  .audio-license-footer,
  .license-grid {
    grid-template-columns: 1fr;
  }

  .audio-license-footer {
    gap: 20px;
  }
}
</style>
