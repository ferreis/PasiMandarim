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

Isso evita apresentar o Pinyin do caractere como se fosse necessariamente o nome usado para todas as suas formas posicionais.

### Fonte dos radicais

Os dados estruturados são sincronizados a partir de uma revisão fixada do projeto `bluegreenstone/hanzi-project`, que mantém proveniência por campo e agrega fontes como Unicode/Unihan, CNS de Taiwan e acervos históricos.

A camada de traduções e explicações em português é mantida pelo Learning Mandarin. Quando a fonte não possui uma forma histórica verificada, a interface informa a ausência em vez de inventar uma etimologia.

Para regenerar o catálogo completo:

```bash
npm run radicals:sync
```

O script valida que os **214** registros foram obtidos antes de gerar `src/data/generatedRadicals.ts`.

## Stack

- Vue 3
- Vite
- TypeScript
- HTML Audio API
- `localStorage` para histórico dos flashcards
- Node.js 22+ para geração/sincronização dos catálogos
- `tar` com suporte a XZ para extrair os pacotes completos Shtooka/SWAC

## Matriz de Pinyin

A matriz compartilhada fica em `data/pinyin-matrix.json` e contém as combinações válidas de iniciais e finais usadas pelo frontend e pelo sincronizador de áudio.

A matriz de inicial + final é fonotática. Isso não significa que todos os cinco tons existam como palavras reais para toda sílaba. Por exemplo, duas iniciais podem aceitar a final `a`, mas um dos tons pode não possuir uma sílaba lexical correspondente ou uma gravação isolada disponível. Por isso o seletor de tom usa a interseção dos áudios realmente catalogados.

O sistema trata as regras ortográficas especiais do Pinyin. Exemplos:

- sem inicial + `ian` → `yan`;
- sem inicial + `u` → `wu`;
- sem inicial + `ü` → `yu`;
- `j` + `üe` → `jue`;
- `q` + `üan` → `quan`.

## Áudio humano

O projeto utiliza gravações humanas verificáveis e mantém os respectivos créditos/licenças no rodapé da aplicação. Para o ambiente web estático, o catálogo principal é otimizado para reprodução no navegador; o projeto também possui sincronização dos acervos Shtooka/SWAC.

### Baixar os áudios diretamente

```bash
npm install
npm run audio:sync
```

O sincronizador:

1. lê todas as combinações de `data/pinyin-matrix.json`;
2. baixa pacotes Shtooka/SWAC configurados;
3. extrai os arquivos e lê os metadados originais;
4. aceita apenas entradas monossilábicas que possam ser mapeadas com segurança para inicial + final + tom;
5. copia as gravações aceitas para `public/audio/shtooka/`;
6. consulta fontes complementares configuradas para tentar preencher lacunas;
7. gera o catálogo consumido pelo frontend;
8. informa a cobertura final da matriz.

Os pacotes baixados e extraídos ficam em `.cache/shtooka/` e não são versionados.

Para baixar novamente arquivos já existentes:

```bash
npm run audio:sync:force
```

## Por que ainda pode faltar um tom?

O contador de gravações não significa cobertura completa da matriz. Ele representa quantas combinações `inicial + final + tom` foram encontradas com gravação humana isolada e verificável.

Nem toda combinação teórica possui uma palavra real em mandarim. Além disso, uma palavra pode existir, mas não estar presente nas coleções abertas usadas pelo projeto. O sistema não cria áudio sintético para preencher essas lacunas.

Para evitar exercícios quebrados, a interface:

- mostra apenas finais que possuem pelo menos um mesmo tom gravado para A e B;
- mostra apenas tons com gravação humana nos dois lados;
- não gera uma questão de flashcard sem um par reproduzível.

## Estrutura

```text
data/
└── pinyin-matrix.json

scripts/
├── sync-human-audio.mjs
├── sync-web-audio-catalog.mjs
└── sync-radicals.mjs

src/
├── components/
│   ├── ComparisonTrainer.vue
│   ├── FlashcardTrainer.vue
│   └── RadicalsExplorer.vue
├── data/
│   ├── audioCatalog.ts
│   ├── generatedAudioCatalog.ts
│   ├── generatedRadicals.ts
│   ├── pinyinMatrix.ts
│   └── radicalVariants.ts
├── services/
├── types/
└── App.vue
```

## Desenvolvimento

```bash
npm install
npm run audio:web-catalog
npm run radicals:sync
npm run dev
```

Validação:

```bash
node --check scripts/sync-human-audio.mjs
node --check scripts/sync-web-audio-catalog.mjs
node --check scripts/sync-radicals.mjs
npm run typecheck
npm run build
```

## Política de catálogo de áudio

Cada gravação aceita registra metadados como Pinyin, inicial, final, tom, arquivo/URL, fonte, falante, créditos e licença.

O projeto nunca usa TTS ou voz gerada por IA para completar automaticamente uma combinação ausente.
