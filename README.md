# Learning Mandarin

Treinador gratuito e open source de percepção auditiva de mandarim, com foco em Pinyin, tons e contrastes fonéticos.

## Objetivo

O exercício mantém **final + tom** iguais e altera somente a inicial. Exemplo:

- `biān` × `piān`
- `dā` × `tā`
- `gā` × `kā`

A interface permite escolher **Inicial A**, **Inicial B**, uma **Final comum válida** e o **Tom**. Combinações que não existem no mandarim não são oferecidas.

## Princípios

- Interface em português do Brasil.
- Gratuito e open source.
- Sem API paga.
- Sem TTS ou voz gerada por IA como referência.
- Somente gravações humanas com origem e licença verificáveis.
- Preferência por comparar gravações do mesmo falante.
- Áudios podem ser baixados e usados localmente.

## Teste flashcard auditivo

O flashcard usa a mesma seleção de **Inicial A**, **Inicial B**, **Final** e **Tom** do modo de comparação.

A cada rodada:

1. o sistema sorteia criptograficamente qual áudio será usado, A ou B;
2. a ordem visual das duas opções de resposta também é embaralhada;
3. o usuário precisa reproduzir o áudio antes de responder;
4. a sílaba correta permanece escondida durante a pergunta;
5. o usuário escolhe **Inicial A** ou **Inicial B**;
6. somente depois da resposta o sistema informa acerto/erro e revela a sílaba;
7. a próxima rodada faz um novo sorteio independente.

O teste só é habilitado quando existem gravações humanas validadas para os dois lados. Se as duas iniciais selecionadas forem iguais, o flashcard é bloqueado por não haver contraste a identificar.

A sessão mantém uma contagem simples de acertos e total de respostas.

## Stack

- Vue 3
- Vite
- TypeScript
- HTML Audio API
- Node.js 22+ para sincronização do acervo

## Matriz de Pinyin

A matriz compartilhada fica em `data/pinyin-matrix.json` e contém as combinações válidas de iniciais e finais usadas pelo frontend e pelo sincronizador de áudio.

O sistema trata as regras ortográficas especiais do Pinyin. Exemplos:

- sem inicial + `ian` → `yan`;
- sem inicial + `u` → `wu`;
- sem inicial + `ü` → `yu`;
- `j` + `üe` → `jue`;
- `q` + `üan` → `quan`.

## Áudio humano

O projeto prioriza dois acervos Shtooka disponíveis também no Wikimedia Commons:

1. **Wei Gao** — falante de Pequim, gravações de 2006, créditos Wei Gao e Vion Nicolas, CC BY 2.0 FR.
2. **Yue Tan** — falante de Liaoning, gravações de 2009, CC BY-SA 3.0 US.

O frontend nunca considera uma amostra válida apenas porque existe um arquivo com o nome esperado. O sincronizador verifica os metadados do Wikimedia Commons e só aceita arquivos associados ao Shtooka e a um falante humano conhecido.

### Baixar os áudios diretamente

```bash
npm install
npm run audio:sync
```

O comando:

1. lê todas as combinações válidas de `data/pinyin-matrix.json`;
2. gera os cinco tons de cada sílaba;
3. consulta o Wikimedia Commons em lotes;
4. procura arquivos `Zh-*` e `Cmn-*` em OGG/OGA;
5. verifica fonte, falante e licença;
6. baixa as gravações aceitas para `public/audio/shtooka/`;
7. gera `public/audio/shtooka/catalog.json`;
8. reescreve `src/data/generatedAudioCatalog.ts` apontando para os arquivos locais.

Para baixar novamente arquivos já existentes:

```bash
npm run audio:sync:force
```

Depois da sincronização, o navegador reproduz os arquivos locais e não precisa consultar o Wikimedia para esses áudios.

## Estrutura

```text
data/
└── pinyin-matrix.json

scripts/
└── sync-human-audio.mjs

public/
└── audio/
    └── shtooka/

src/
├── data/
│   ├── audioCatalog.ts
│   ├── generatedAudioCatalog.ts
│   └── pinyinMatrix.ts
├── services/
│   └── audioPlayer.ts
├── types/
│   └── audio.ts
├── utils/
│   └── pinyin.ts
└── App.vue
```

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação:

```bash
npm run typecheck
npm run build
```

## Política de catálogo

Cada gravação aceita registra:

- Pinyin;
- inicial;
- final;
- tom;
- caractere, quando disponível nos metadados;
- arquivo local;
- URL original;
- página original no Commons;
- falante;
- origem do falante;
- créditos;
- licença.

Quando os dois lados de uma comparação possuem áudio, a interface informa se eles foram gravados pelo mesmo falante. Quando uma combinação ainda não possui gravação humana validada, o botão de áudio permanece desativado.
