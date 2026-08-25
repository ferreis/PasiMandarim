<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { generatedRadicals } from '../data/generatedRadicals'
import { getRadicalVariants } from '../data/radicalVariants'
import type { MandarinRadical, RadicalHistoricalForm } from '../types/radical'

const search = ref('')
const strokeFilter = ref(0)
const selectedNumber = ref(generatedRadicals[0]?.number ?? 1)

const historicalLabels: Record<RadicalHistoricalForm, string> = {
  oracle: 'Ossos oraculares · 甲骨文',
  bronze: 'Bronze · 金文',
  seal: 'Selo do Shuowen · 說文解字',
  liushutong: 'Liushutong · 六書通',
}

const strokeOptions = computed(() =>
  [...new Set(generatedRadicals.map((radical) => radical.strokes))].sort((a, b) => a - b),
)

function variantsFor(radical: MandarinRadical): string[] {
  return getRadicalVariants(radical.number, radical.variants)
}

const filteredRadicals = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('pt-BR')

  return generatedRadicals.filter((radical) => {
    if (strokeFilter.value && radical.strokes !== strokeFilter.value) return false
    if (!query) return true

    return [
      radical.character,
      radical.radicalCharacter,
      radical.pinyin,
      radical.zhuyin,
      radical.meaningPt,
      radical.meaningEn,
      ...variantsFor(radical),
      ...radical.exampleCharacters,
      String(radical.number),
    ].some((value) => value.toLocaleLowerCase('pt-BR').includes(query))
  })
})

const selectedRadical = computed<MandarinRadical | undefined>(() =>
  generatedRadicals.find((radical) => radical.number === selectedNumber.value),
)

const selectedVariants = computed(() =>
  selectedRadical.value ? variantsFor(selectedRadical.value) : [],
)

watch(filteredRadicals, (radicals) => {
  if (!radicals.length) return
  if (!radicals.some((radical) => radical.number === selectedNumber.value)) {
    selectedNumber.value = radicals[0].number
  }
})
</script>

<template>
  <section class="radicals-explorer">
    <div class="radicals-toolbar">
      <label class="radical-search">
        <span>Buscar radical</span>
        <input
          v-model="search"
          type="search"
          placeholder="Ex.: 水, shuǐ, água, 氵, 85…"
          autocomplete="off"
        />
      </label>

      <label>
        <span>Traços</span>
        <select v-model.number="strokeFilter">
          <option :value="0">Todos</option>
          <option v-for="strokes in strokeOptions" :key="strokes" :value="strokes">
            {{ strokes }} {{ strokes === 1 ? 'traço' : 'traços' }}
          </option>
        </select>
      </label>

      <div class="radical-count" role="status">
        <strong>{{ filteredRadicals.length }}</strong>
        <span>de {{ generatedRadicals.length }} radicais</span>
      </div>
    </div>

    <p class="radical-learning-note">
      O Pinyin abaixo é a leitura principal do caractere usado como radical. O nome falado de uma
      variante pode ser diferente: por exemplo, <b>水 shuǐ</b> pode aparecer como <b>氵</b>,
      frequentemente chamado <b>三点水 (sān diǎn shuǐ)</b>.
    </p>

    <div class="radicals-layout">
      <div class="radical-list" aria-label="Lista de radicais Kangxi">
        <button
          v-for="radical in filteredRadicals"
          :key="radical.number"
          type="button"
          class="radical-card"
          :class="{ active: radical.number === selectedNumber }"
          :aria-pressed="radical.number === selectedNumber"
          @click="selectedNumber = radical.number"
        >
          <span class="radical-number">#{{ radical.number }}</span>
          <strong>{{ radical.character }}</strong>
          <span class="radical-pinyin">{{ radical.pinyin || '—' }}</span>
          <span class="radical-meaning">{{ radical.meaningPt }}</span>
          <small>{{ radical.strokes }} {{ radical.strokes === 1 ? 'traço' : 'traços' }}</small>
        </button>

        <p v-if="!filteredRadicals.length" class="radical-empty">
          Nenhum radical encontrado com estes filtros.
        </p>
      </div>

      <article v-if="selectedRadical" class="radical-detail">
        <div class="radical-detail-heading">
          <div>
            <span class="radical-detail-number">Radical Kangxi #{{ selectedRadical.number }}</span>
            <h2>{{ selectedRadical.character }}</h2>
          </div>
          <div class="radical-reading">
            <strong>{{ selectedRadical.pinyin || 'Sem leitura catalogada' }}</strong>
            <span v-if="selectedRadical.zhuyin">{{ selectedRadical.zhuyin }}</span>
          </div>
        </div>

        <div class="radical-facts">
          <div>
            <span>Significado</span>
            <strong>{{ selectedRadical.meaningPt }}</strong>
          </div>
          <div>
            <span>Traços</span>
            <strong>{{ selectedRadical.strokes }}</strong>
          </div>
          <div>
            <span>Forma Kangxi</span>
            <strong>{{ selectedRadical.radicalCharacter }}</strong>
          </div>
          <div>
            <span>Variantes usuais</span>
            <strong>{{ selectedVariants.length ? selectedVariants.join(' · ') : '—' }}</strong>
          </div>
        </div>

        <section class="radical-detail-section">
          <h3>Explicação</h3>
          <p>{{ selectedRadical.explanationPt }}</p>
        </section>

        <section class="radical-detail-section">
          <h3>História e formas registradas</h3>
          <p v-if="selectedRadical.historicalForms.length">
            O acervo de referência possui registros gráficos históricos deste radical nas seguintes
            tradições. A presença de uma forma indica evidência catalogada, não que todas as etapas
            tenham a mesma função ou desenho.
          </p>
          <p v-else>
            A versão atual da fonte não possui uma forma histórica aprovada para este radical. Isso
            não significa que o radical não tenha formas antigas; significa apenas que não há um
            registro verificado no conjunto usado pelo projeto.
          </p>
          <div v-if="selectedRadical.historicalForms.length" class="historical-chips">
            <span v-for="form in selectedRadical.historicalForms" :key="form">
              {{ historicalLabels[form] }}
            </span>
          </div>
        </section>

        <section v-if="selectedRadical.exampleCharacters.length" class="radical-detail-section">
          <h3>Caracteres de exemplo</h3>
          <div class="radical-examples">
            <span v-for="character in selectedRadical.exampleCharacters" :key="character">
              {{ character }}
            </span>
          </div>
        </section>

        <section class="radical-source">
          <div>
            <strong>Fonte verificável</strong>
            <p>
              Dados estruturados do Hanzi Project, revisão fixada. O projeto agrega fontes como
              Unicode/Unihan e CNS de Taiwan e mantém a proveniência de cada campo. Variantes usuais
              adicionais são mantidas pelo Learning Mandarin como ajuda didática.
            </p>
          </div>
          <a :href="selectedRadical.sourceUrl" target="_blank" rel="noreferrer">Ver registro original</a>
        </section>
      </article>
    </div>
  </section>
</template>

<style scoped>
.radicals-explorer {
  display: grid;
  gap: 22px;
}

.radicals-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(150px, 220px) auto;
  gap: 16px;
  align-items: end;
  padding: 22px;
  border: 1px solid #d9e0e7;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 14px 42px rgba(23, 32, 42, 0.06);
}

.radicals-toolbar label {
  display: grid;
  gap: 8px;
}

.radicals-toolbar label > span {
  color: #52606d;
  font-size: 0.82rem;
  font-weight: 800;
}

.radicals-toolbar input,
.radicals-toolbar select {
  width: 100%;
  min-height: 46px;
  padding: 11px 13px;
  border: 1px solid #cfd8e3;
  border-radius: 12px;
  background: #fff;
  color: #17202a;
  font: inherit;
}

.radical-count {
  display: grid;
  min-width: 120px;
  padding: 9px 14px;
  border-radius: 12px;
  background: #f5f7f9;
}

.radical-count strong {
  font-size: 1.35rem;
}

.radical-count span {
  color: #687784;
  font-size: 0.75rem;
}

.radical-learning-note {
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #eef4f8;
  color: #425466;
  line-height: 1.55;
}

.radicals-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(390px, 0.85fr);
  gap: 22px;
  align-items: start;
}

.radical-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 12px;
}

.radical-card {
  display: grid;
  justify-items: start;
  gap: 5px;
  min-height: 164px;
  padding: 15px;
  border: 1px solid #d9e0e7;
  border-radius: 15px;
  background: #fff;
  color: #17202a;
  text-align: left;
  transition: transform 130ms ease, border-color 130ms ease, box-shadow 130ms ease;
}

.radical-card:hover {
  transform: translateY(-2px);
  border-color: #9caab7;
  box-shadow: 0 10px 30px rgba(23, 32, 42, 0.08);
}

.radical-card.active {
  border-color: #17202a;
  box-shadow: inset 0 0 0 1px #17202a;
}

.radical-card > strong {
  margin-top: 2px;
  font-size: 2.5rem;
  line-height: 1;
}

.radical-number,
.radical-card small {
  color: #7a8793;
  font-size: 0.72rem;
  font-weight: 700;
}

.radical-pinyin {
  font-weight: 850;
}

.radical-meaning {
  color: #52606d;
  font-size: 0.82rem;
  line-height: 1.3;
}

.radical-empty {
  grid-column: 1 / -1;
  margin: 0;
  padding: 28px;
  border: 1px dashed #cfd8e3;
  border-radius: 15px;
  color: #687784;
  text-align: center;
}

.radical-detail {
  position: sticky;
  top: 98px;
  overflow: hidden;
  border: 1px solid #d9e0e7;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(23, 32, 42, 0.08);
}

.radical-detail-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding: 26px;
  background: #17202a;
  color: #fff;
}

.radical-detail-number {
  color: #c7d0d8;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.radical-detail h2 {
  margin: 5px 0 0;
  font-size: clamp(4rem, 7vw, 6.6rem);
  line-height: 0.9;
}

.radical-reading {
  display: grid;
  justify-items: end;
  gap: 4px;
  text-align: right;
}

.radical-reading strong {
  font-size: 1.35rem;
}

.radical-reading span {
  color: #c7d0d8;
}

.radical-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: #e4e9ee;
}

.radical-facts > div {
  display: grid;
  gap: 5px;
  padding: 16px 20px;
  background: #f8fafb;
}

.radical-facts span {
  color: #687784;
  font-size: 0.75rem;
  font-weight: 700;
}

.radical-detail-section {
  padding: 22px 26px 0;
}

.radical-detail-section h3 {
  margin: 0 0 8px;
  font-size: 0.96rem;
}

.radical-detail-section p {
  margin: 0;
  color: #52606d;
  line-height: 1.65;
}

.historical-chips,
.radical-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.historical-chips span {
  padding: 7px 10px;
  border-radius: 999px;
  background: #eef4f8;
  color: #425466;
  font-size: 0.76rem;
  font-weight: 750;
}

.radical-examples span {
  display: grid;
  place-items: center;
  min-width: 48px;
  min-height: 48px;
  border-radius: 12px;
  background: #f5f7f9;
  font-size: 1.65rem;
}

.radical-source {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
  margin-top: 24px;
  padding: 20px 26px 24px;
  border-top: 1px solid #e3e8ee;
}

.radical-source p {
  margin: 5px 0 0;
  color: #687784;
  font-size: 0.78rem;
  line-height: 1.5;
}

.radical-source a {
  padding: 9px 12px;
  border: 1px solid #cfd8e3;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

@media (max-width: 1050px) {
  .radicals-layout {
    grid-template-columns: 1fr;
  }

  .radical-detail {
    position: static;
  }
}

@media (max-width: 720px) {
  .radicals-toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .radical-search {
    grid-column: 1 / -1;
  }

  .radical-count {
    align-self: stretch;
  }

  .radical-list {
    grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
  }
}

@media (max-width: 500px) {
  .radicals-toolbar {
    grid-template-columns: 1fr;
  }

  .radical-search {
    grid-column: auto;
  }

  .radical-detail-heading,
  .radical-source {
    grid-template-columns: 1fr;
  }

  .radical-detail-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .radical-reading {
    justify-items: start;
    text-align: left;
  }
}
</style>
