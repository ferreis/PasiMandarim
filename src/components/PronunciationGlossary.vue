<script setup lang="ts">
const terms = [
  {
    title: 'Aspiração',
    short: 'Quantidade de ar liberada logo após abrir a obstrução.',
    explanation:
      'No mandarim, pares como b/p, d/t, g/k, j/q, zh/ch e z/c se diferenciam principalmente pela aspiração. Em p, t, k, q, ch e c há uma rajada de ar perceptível. Em b, d, g, j, zh e z essa rajada é bem menor.',
    test: 'Teste simples: coloque a mão ou uma folha de papel diante da boca. Em pinyin p, t ou k o movimento do ar deve ser bem mais evidente.',
  },
  {
    title: 'Sonorização',
    short: 'Indica se as pregas vocais vibram durante o som.',
    explanation:
      'Um som sonoro usa vibração das pregas vocais; um som surdo não usa essa vibração como característica principal. No mandarim, b, d e g do Pinyin são normalmente surdos, apesar de as letras lembrarem consoantes sonoras do português.',
    test: 'Encoste os dedos suavemente na garganta: em m, n, l ou r você percebe vibração; em p, t, k, f ou x ela não deve ser a característica dominante.',
  },
  {
    title: 'Lugar de articulação',
    short: 'Região da boca onde o ar é bloqueado ou estreitado.',
    explanation:
      'Pode ser nos lábios, dentes, alvéolos, palato duro, região pós-alveolar ou palato mole. É o “onde” do som. Mudar esse ponto pode transformar completamente a inicial, como acontece em x, sh e s.',
    test: 'Observe no desenho a área destacada e tente perceber qual parte da língua ou dos lábios chega mais perto dela.',
  },
  {
    title: 'Modo de articulação',
    short: 'Forma como o fluxo de ar é controlado.',
    explanation:
      'Oclusiva significa bloquear o ar e soltá-lo; fricativa significa deixar o ar passar por uma abertura estreita; africada combina uma pequena oclusão com fricção; nasal deixa o ar sair pelo nariz; lateral deixa o ar escapar pelos lados da língua.',
    test: 'Compare d (oclusiva), x (fricativa), j (africada), n (nasal) e l (lateral). O ponto da boca não é a única diferença: o caminho do ar também muda.',
  },
  {
    title: 'IPA / AFI',
    short: 'Alfabeto Fonético Internacional: representação do som, não da letra.',
    explanation:
      'O Pinyin é um sistema de romanização, então a letra escrita não deve ser lida automaticamente como em português. O IPA mostra o valor fonético aproximado. Por exemplo, b do Pinyin aparece como [p], enquanto p aparece como [pʰ].',
    test: 'Use o IPA para entender a relação entre dois sons, mas use sempre a gravação humana como referência principal de pronúncia.',
  },
  {
    title: 'Ponta, lâmina e dorso da língua',
    short: 'Partes diferentes da língua participam de sons diferentes.',
    explanation:
      'A ponta é a extremidade frontal. A lâmina fica logo atrás da ponta. O dorso é a parte maior e posterior. Em j/q/x, por exemplo, a ponta fica baixa enquanto a lâmina e a frente do dorso se elevam. Em g/k/h, quem trabalha principalmente é a parte de trás do dorso.',
    test: 'Não tente mover “a língua inteira”. Identifique qual região deve subir, recuar ou permanecer baixa.',
  },
]
</script>

<template>
  <section class="pronunciation-glossary" aria-labelledby="pronunciation-glossary-title">
    <div class="glossary-heading">
      <div>
        <p class="eyebrow">Antes de praticar</p>
        <h3 id="pronunciation-glossary-title">O que significam os termos?</h3>
      </div>
      <p>
        Estes conceitos aparecem nos guias das iniciais. Abra qualquer item quando precisar rever o significado.
      </p>
    </div>

    <div class="glossary-grid">
      <details v-for="term in terms" :key="term.title" class="glossary-term">
        <summary>
          <span>
            <strong>{{ term.title }}</strong>
            <small>{{ term.short }}</small>
          </span>
          <span class="glossary-plus" aria-hidden="true">+</span>
        </summary>
        <div class="glossary-body">
          <p>{{ term.explanation }}</p>
          <div class="glossary-test">
            <strong>Como perceber na prática</strong>
            <span>{{ term.test }}</span>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>

<style scoped>
.pronunciation-glossary {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid #d9e0e7;
  border-radius: 18px;
  background: #f8fafb;
}

.glossary-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.glossary-heading .eyebrow {
  margin: 0 0 4px;
}

.glossary-heading h3 {
  margin: 0;
  font-size: 1.15rem;
}

.glossary-heading > p {
  max-width: 640px;
  margin: 0;
  color: #687784;
  font-size: 0.83rem;
  line-height: 1.5;
}

.glossary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.glossary-term {
  overflow: hidden;
  border: 1px solid #d9e0e7;
  border-radius: 13px;
  background: #fff;
}

.glossary-term summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 76px;
  padding: 13px 14px;
  cursor: pointer;
  list-style: none;
}

.glossary-term summary::-webkit-details-marker {
  display: none;
}

.glossary-term summary > span:first-child {
  display: grid;
  gap: 4px;
}

.glossary-term summary strong {
  color: #17202a;
  font-size: 0.88rem;
}

.glossary-term summary small {
  color: #687784;
  font-size: 0.74rem;
  line-height: 1.35;
}

.glossary-plus {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eef4f8;
  color: #425466;
  font-size: 1.1rem;
  font-weight: 700;
  transition: transform 150ms ease;
}

.glossary-term[open] .glossary-plus {
  transform: rotate(45deg);
}

.glossary-body {
  display: grid;
  gap: 11px;
  padding: 0 14px 14px;
  border-top: 1px solid #edf0f3;
}

.glossary-body > p {
  margin: 12px 0 0;
  color: #52606d;
  font-size: 0.8rem;
  line-height: 1.55;
}

.glossary-test {
  display: grid;
  gap: 4px;
  padding: 10px 11px;
  border-radius: 10px;
  background: #eef8f2;
  color: #285c3d;
  font-size: 0.76rem;
  line-height: 1.45;
}

@media (max-width: 1050px) {
  .glossary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .glossary-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .glossary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
