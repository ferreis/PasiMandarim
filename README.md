# Learning Mandarin

Treinador gratuito e open source de percepção auditiva de mandarim, com foco em Pinyin, tons e contrastes fonéticos.

## Objetivo

O exercício mantém **final + tom** iguais e altera somente a inicial. Exemplo:

- `biān` × `piān`
- `dā` × `tā`
- `gā` × `kā`

A interface permite escolher **Inicial A**, **Inicial B**, uma **Final comum válida** e o **Tom**. Para o treino auditivo, finais e tons são filtrados para mostrar apenas combinações que possuam gravação humana catalogada nos dois lados.

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

O projeto prioriza dois acervos Shtooka/SWAC preservados pelo mirror Yojik e também disponíveis parcialmente no Wikimedia Commons:

1. **Yue Tan** — falante de Liaoning, coleção `cmn-caen-tan`, 8.597 gravações, CC BY-SA 3.0 US.
2. **Wei Gao** — falante de Pequim, coleção `cmn-balm-hsk1`, cerca de 1.000 gravações, créditos Wei Gao e Vion Nicolas, CC BY 2.0 FR.

O pacote maior de Yue Tan é processado primeiro para aumentar a chance de os dois lados de uma comparação usarem a mesma pessoa.

### Baixar os áudios diretamente

```bash
npm install
npm run audio:sync
```

O comando agora trabalha em duas etapas:

1. lê todas as combinações de `data/pinyin-matrix.json`;
2. baixa os pacotes completos Shtooka/SWAC do mirror Yojik;
3. extrai os arquivos FLAC e lê o `index.tags.txt` original de cada coleção;
4. aceita apenas entradas monossilábicas que possam ser mapeadas com segurança para inicial + final + tom;
5. copia essas gravações para `public/audio/shtooka/`;
6. consulta o Wikimedia Commons apenas para tentar preencher as lacunas restantes;
7. no Commons, verifica Shtooka, falante humano conhecido e licença Creative Commons;
8. gera `public/audio/shtooka/catalog.json`;
9. reescreve `src/data/generatedAudioCatalog.ts` apontando para os arquivos locais;
10. informa no terminal a cobertura final da matriz e quantas combinações continuam sem gravação isolada.

Os pacotes baixados e extraídos ficam em `.cache/shtooka/` e não são versionados.

Para baixar novamente arquivos já existentes:

```bash
npm run audio:sync:force
```

Depois da sincronização, o navegador reproduz os arquivos locais e não precisa consultar o Wikimedia para esses áudios.

## Por que ainda pode faltar um tom?

O contador de gravações não significa cobertura completa da matriz. Ele representa quantas combinações `inicial + final + tom` foram encontradas com gravação humana isolada e verificável.

Nem toda combinação teórica possui uma palavra real em mandarim. Além disso, uma palavra pode existir, mas não estar presente nas coleções abertas usadas pelo projeto. O sistema não cria áudio sintético para preencher essas lacunas.

Para evitar exercícios quebrados, a interface:

- mostra apenas finais que possuem pelo menos um mesmo tom gravado para A e B;
- mostra apenas tons com gravação humana nos dois lados;
- não exibe um flashcard quando não há um par reproduzível.

## Estrutura

```text
data/
└── pinyin-matrix.json

scripts/
└── sync-human-audio.mjs

.cache/
└── shtooka/

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
node --check scripts/sync-human-audio.mjs
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
- URL/pacote original;
- página da fonte;
- falante;
- origem do falante;
- créditos;
- licença.

O projeto nunca usa TTS ou voz gerada por IA para completar automaticamente uma combinação ausente.
