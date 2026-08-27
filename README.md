# Learning Mandarin

Treinador gratuito e open source para estudo de mandarim, com foco em percepção auditiva, Pinyin, tons, contrastes fonéticos e radicais chineses.

## Objetivo

No modo de comparação auditiva, o exercício mantém **final + tom** iguais e altera somente a inicial. Exemplo:

- `biān` × `piān`
- `dā` × `tā`
- `gā` × `kā`

A interface permite escolher **Inicial A**, **Inicial B**, uma **Final comum válida** e o **Tom**. Para o treino auditivo, finais e tons são filtrados para mostrar apenas combinações que possuam gravação humana catalogada nos dois lados.

## Princípios

- Interface em português do Brasil.
- Gratuito e open source.
- Sem API paga obrigatória.
- Sem TTS ou voz gerada por IA como referência de pronúncia.
- Somente gravações humanas com origem e licença verificáveis.
- Preferência por comparar gravações do mesmo falante.
- Conteúdo histórico apresentado com fonte verificável; ausência de evidência não é preenchida por inferência.

## Teste flashcard auditivo

Na tela **Flashcards**, o usuário escolhe somente **Inicial A**, **Inicial B** e a quantidade de questões.

A cada sessão:

1. o sistema seleciona finais e tons que possuem áudio humano para as duas iniciais;
2. as questões são embaralhadas;
3. o sistema sorteia se o áudio corresponde à Inicial A ou B;
4. a ordem visual das respostas A/B também é embaralhada;
5. o usuário precisa reproduzir o áudio antes de responder;
6. somente depois da resposta são revelados Pinyin, final, tom e acerto/erro;
7. cada tentativa é salva no `localStorage` do navegador.

O mini-dashboard mostra acertos, erros, precisão, histórico do par de iniciais e as finais em que o usuário mais erra.

## Identificação de pares tonais

A tela **Tons** treina palavras reais de duas sílabas. A primeira sílaba pode ter um dos quatro tons lexicais e a segunda pode ter os tons 1–4 ou o **tom neutro**, formando 20 categorias possíveis.

O usuário pode selecionar separadamente:

- quais tons `1–4` podem aparecer na primeira sílaba;
- quais opções `1–4 + neutro` podem aparecer na segunda sílaba;
- a quantidade de palavras da sessão.

Durante uma questão, a palavra e o Pinyin ficam escondidos. O usuário ouve a gravação humana e escolhe o tom de cada sílaba. Depois de confirmar, o sistema revela o Hanzi, Pinyin, tradução em português, resposta correta e atualiza o histórico salvo no navegador.

O dashboard registra os pares com mais erros. Para o par lexical `3–3`, a interface também explica o sandhi do terceiro tom: na fala contínua, o primeiro terceiro tom normalmente é realizado com um contorno semelhante ao segundo.

### Áudios dos pares tonais

As palavras vêm do **Mandarin Chinese Tone Pair Drills**, de John Pasden / Sinosplice, distribuído sob **CC BY-NC-SA 2.5**. Os arquivos são gravações humanas e são baixados durante a preparação do site estático.

```bash
npm run tone-pairs:sync
```

O script valida a origem HTTPS, tipo e tamanho do arquivo e exige cobertura das 20 combinações antes de concluir.

## Radicais chineses

A tela **Radicais** apresenta os **214 radicais Kangxi** e permite pesquisar por símbolo, número, Pinyin, Zhuyin, significado em português, variante e caracteres de exemplo.

Cada radical pode apresentar:

- número Kangxi;
- caractere principal;
- forma do bloco Kangxi;
- Pinyin da leitura principal;
- Zhuyin;
- tradução/significado em português;
- quantidade de traços;
- variantes usuais, como `亻`, `扌`, `氵`, `艹` e `讠`;
- explicação didática em português;
- caracteres de exemplo;
- indicação de formas históricas verificadas em ossos oraculares, bronze, selo do *Shuowen Jiezi* e/ou *Liushutong*;
- link para o registro-fonte.

### Leitura não é sempre o nome da variante

O projeto diferencia a leitura do caractere usado como radical do nome coloquial de uma variante. Por exemplo:

- `水` → `shuǐ`;
- `氵` é uma variante de água e costuma ser chamada `三点水 (sān diǎn shuǐ)`.

### Fonte dos radicais

Os dados estruturados são sincronizados a partir de uma revisão fixada do projeto `bluegreenstone/hanzi-project`, que mantém proveniência por campo e agrega fontes como Unicode/Unihan, CNS de Taiwan e acervos históricos.

Para regenerar o catálogo completo:

```bash
npm run radicals:sync
```

## Stack

- Vue 3
- Vite
- TypeScript
- HTML Audio API
- `localStorage` para históricos de treino
- Playwright para testes E2E
- Node.js 22+ para geração/sincronização dos catálogos

## Matriz de Pinyin

A matriz compartilhada fica em `data/pinyin-matrix.json` e contém as combinações válidas de iniciais e finais usadas pelo frontend e pelo sincronizador de áudio.

A matriz de inicial + final é fonotática. Isso não significa que todos os cinco tons existam como palavras reais para toda sílaba. Por isso o seletor de tom do comparador usa a interseção dos áudios realmente catalogados.

O sistema trata regras ortográficas especiais do Pinyin, como `yan`, `wu`, `yu`, `jue` e `quan`.

## Áudio humano

O projeto utiliza somente gravações humanas verificáveis como referência e mantém créditos/licenças no rodapé da aplicação. Cada acervo permanece sujeito à sua licença própria.

### Sincronizar sílabas Shtooka/SWAC

```bash
npm install
npm run audio:sync
```

### Preparar os áudios do treino de tons

```bash
npm run tone-pairs:sync
```

O projeto nunca usa TTS ou voz gerada por IA para preencher uma gravação ausente.

## Estrutura

```text
data/
├── pinyin-matrix.json
└── tone-pairs.json

scripts/
├── sync-human-audio.mjs
├── sync-web-audio-catalog.mjs
├── sync-tone-pair-audio.mjs
└── sync-radicals.mjs

src/
├── components/
│   ├── ComparisonTrainer.vue
│   ├── FlashcardTrainer.vue
│   ├── TonePairTrainer.vue
│   └── RadicalsExplorer.vue
├── data/
├── services/
├── types/
└── App.vue
```

## Desenvolvimento

```bash
npm install
npm run audio:web-catalog
npm run tone-pairs:sync
npm run radicals:sync
npm run dev
```

Validação:

```bash
node --check scripts/sync-human-audio.mjs
node --check scripts/sync-web-audio-catalog.mjs
node --check scripts/sync-tone-pair-audio.mjs
node --check scripts/sync-radicals.mjs
npm audit --audit-level=high
npm run typecheck
npm run test:e2e
npm run build
```
