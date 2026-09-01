# Pasi Mandarim

Ferramenta web estática, gratuita e de código aberto para apoiar pessoas que falam português brasileiro no estudo da pronúncia do mandarim.

O projeto trabalha Pinyin, iniciais, finais, tons e percepção auditiva. Não substitui professores ou cursos: busca diminuir a barreira de começar a estudar mandarim sem depender de explicações em outra língua, assinatura ou bloqueio artificial de exercícios.

> O nome público é **Pasi Mandarim**. O nome técnico do repositório e a URL do GitHub Pages ainda refletem a migração pendente do repositório.

## Por que português brasileiro

Há muito material de mandarim em inglês. Para brasileiros, isso pode significar aprender mandarim e depender de explicações em outra língua. Comparações fonéticas e instruções de articulação fazem mais sentido quando partem de sons familiares ao português brasileiro. Por isso a interface e o conteúdo didático são escritos diretamente para esse público.

## Princípios do projeto oficial

- Gratuito para estudantes, sem plano premium, assinatura ou paywall para liberar exercícios.
- Público, auditável e construído de forma comunitária.
- Sem bloqueio proposital de conteúdo educacional para incentivar pagamento.
- Fontes, créditos e licenças de recursos externos documentados.
- Sem prometer substituir ensino profissional, cursos ou avaliação de um professor.

Essa é a filosofia da instância oficial; não é uma restrição adicional à licença AGPL.

## Funcionalidades atuais

- Comparação auditiva de duas iniciais, mantendo final e tom iguais.
- Flashcards de percepção: pares configuráveis como B/P, D/T, Z/C, ZH/CH, J/Q e S/SH, além de outros pares com áudio disponível.
- Geração de sessões com distribuição de iniciais, finais e tons, evitando repetições consecutivas quando há alternativas.
- Feedback após a resposta, com repetição individual e destaque visual do áudio em reprodução. Antes da resposta, não há pista visual do lado correto.
- Treino de pares tonais com palavras reais de duas sílabas e explicação do sandhi 3–3.
- Treino com frases, quando o catálogo licenciado do Tatoeba é gerado.
- Guia de pronúncia das 21 iniciais padrão do Pinyin, com IPA, articulação e referências aproximadas ao português brasileiro.
- Exploração dos 214 radicais Kangxi, com busca, variantes e proveniência dos registros.
- Histórico de respostas salvo somente no navegador do usuário.

## Como funciona

1. Abra **Flashcards** e escolha a categoria de exercício.
2. Em **Comparação**, escolha duas iniciais e inicie a sessão com a quantidade configurada.
3. Em **Configurações**, escolha áudio humano, TTS, ou humano com fallback TTS; nos modos com TTS, escolha a voz.
4. Ouça a questão e escolha a inicial percebida.
5. Depois de responder, veja o resultado e repita cada lado para comparar os sons.
6. O histórico local alimenta os painéis de desempenho do próprio navegador.

## Fontes de dados

| Recurso | Uso | Origem e licença | Redistribuição |
| --- | --- | --- | --- |
| Matriz de Pinyin | `data/pinyin-matrix.json`; combinações válidas | Dados estruturados e regras ortográficas mantidos pelo projeto | Código/dados originais sob AGPL-3.0-only |
| Pares tonais | `data/tone-pairs.json`; seleção de palavras e categorias | Catálogo mantido pelo projeto para o acervo Sinosplice | Ver aviso específico de Sinosplice |
| Radicais Kangxi | `src/data/generatedRadicals.ts` | Revisão fixada do [Hanzi Project](https://github.com/bluegreenstone/hanzi-project) | Licença específica por fonte/campo; não existe licença única para o corpus |
| Frases | `src/data/generatedSentenceCatalog.ts` | Exports e áudios do [Tatoeba](https://tatoeba.org/en/downloads) | Cada item preserva autor e licença; o sincronizador aceita licenças Creative Commons explícitas |
| Guia de iniciais | `src/data/initialPronunciation.ts` | Texto didático original; referências fonéticas apontadas no arquivo | Texto/código original sob AGPL-3.0-only; referências não são copiadas |

O projeto usa JSON e módulos TypeScript estáticos. Não há banco SQLite, SQLite/WASM ou backend: os dados são somente leitura no bundle e funcionam em hospedagem estática.

## Áudios humanos

Áudio humano e TTS são categorias diferentes.

| Acervo | Uso | Licença/situação | Atribuição e observação |
| --- | --- | --- | --- |
| [audio-cmn](https://github.com/hugolpz/audio-cmn) | Fonte principal de sílabas, reproduzida remotamente | O repositório declara CC BY-SA, sem versão explícita no catálogo usado | Chen Wang e colaboradores; confirme a versão antes de redistribuir cópias locais |
| [Shtooka / Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Shtooka_Project) | Complemento de sílabas | CC BY 2.0 FR ou CC BY-SA 3.0 US conforme a gravação | Wei Gao, Yue Tan e créditos registrados no catálogo individual |
| [Sinosplice Tone Pair Drills](https://www.sinosplice.com/learn-chinese/tone-pair-drills) | Palavras do treino tonal | CC BY-NC-SA 2.5, conforme a fonte | John Pasden / Sinosplice; respeite atribuição, não comercial e compartilhamento pela mesma licença |
| [Tatoeba](https://tatoeba.org/pt-br/audio/index/cmn) | Frases humanas | Variável por item; filtro por licenças Creative Commons explícitas | Autor e licença ficam no catálogo e na interface de cada frase |

Os arquivos humanos baixados pelos scripts ficam em `public/audio/` e não são versionados. Os metadados preservam fonte, licença e créditos. Leia [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) antes de redistribuir qualquer coleção de áudio.

## Text-to-Speech

O TTS é gerado antecipadamente com [`edge-tts`](https://github.com/rany2/edge-tts) e `ffmpeg`; não há chave, token, backend nem chamada de síntese durante a execução no navegador. O gerador produz MP3s em `public/audio/tts/`, com 250 ms de silêncio final sem fade para não encurtar perceptivelmente o contorno tonal.

As vozes configuradas são `zh-CN-XiaoxiaoNeural` (recomendada), `zh-CN-YunxiNeural` e `zh-CN-XiaoyiNeural`. A permissão e os termos para redistribuir os MP3s gerados precisam ser confirmados pelo mantenedor antes de uma distribuição pública ampla; o projeto não afirma que tais arquivos sejam áudio humano nem que sua licença seja AGPL. Consulte os [termos Microsoft](https://www.microsoft.com/servicesagreement) e a documentação da [Speech Service](https://learn.microsoft.com/azure/ai-services/speech-service/language-support).

## Tecnologias

- Vue 3, Vite e TypeScript.
- HTML Audio API e `localStorage`.
- Playwright para testes E2E.
- Node.js para sincronizar catálogos; `edge-tts` e `ffmpeg` apenas para pré-gerar TTS.
- GitHub Actions e GitHub Pages para publicação estática.

## Estrutura do projeto

```text
data/                 dados públicos editáveis de Pinyin e pares tonais
public/               favicon e áudios gerados/localizados durante a preparação
scripts/              sincronizadores de catálogos, áudios, TTS e radicais
src/components/       telas e componentes Vue
src/data/             catálogos gerados e dados didáticos usados pela interface
src/services/         regras de exercícios, áudio, estatísticas e acesso aos dados
src/types/            tipos TypeScript
tests/e2e/            testes Playwright
.github/workflows/    validação e publicação no GitHub Pages
```

## Execução local

Requer Node.js 22 ou superior.

```bash
npm install
npm run dev
```

Comandos existentes:

```bash
npm run typecheck
npm run test:e2e
npm run build
npm run preview
npm run audio:web-catalog
npm run audio:sync
npm run tone-pairs:sync
npm run phrases:sync
npm run radicals:sync
npm run audio:tts:sync
```

Os comandos de sincronização baixam ou geram recursos externos; leia os avisos de licença antes de publicar os arquivos resultantes.

## GitHub Pages

O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) instala dependências, gera catálogos/áudios necessários e publica `dist/` no GitHub Pages. Hoje o `base` do Vite é `/learning_Mandarin/` e a URL publicada é `https://ferreis.github.io/learning_Mandarin/`. Quando o repositório for renomeado, atualize `vite.config.ts`, os links do rodapé, os scripts que identificam o repositório e esta documentação.

## Privacidade

Não há login, conta, analytics, telemetria, cookies de rastreamento, banco remoto ou backend no código atual. Preferências, históricos de treino e estatísticas são gravados no `localStorage` deste navegador. Quando o recurso de microfone é utilizado no guia de pronúncia, o processamento ocorre no navegador e a faixa é encerrada após a tentativa; o código não envia essa gravação para um servidor próprio.

Áudios humanos remotos podem ser buscados diretamente de seus acervos de origem, conforme a fonte selecionada; isso fica sujeito às políticas desses serviços externos.

## Licença: AGPL-3.0-only

O código e a documentação originais deste repositório são licenciados sob a [GNU Affero General Public License v3.0](LICENSE) (`AGPL-3.0-only`). A AGPL permite usar, estudar, copiar, modificar, fazer forks, redistribuir e usar a ferramenta em aulas, universidades, empresas e atividades profissionais, inclusive remuneradas, nos termos da licença.

Ela é uma licença de copyleft: versões distribuídas e certas versões modificadas acessadas por usuários através de uma rede devem preservar as liberdades previstas pela licença e disponibilizar o código-fonte correspondente conforme suas condições. Isso não proíbe cobrar por serviços, aulas ou pela distribuição do software, e não obriga um fork a enviar Pull Request ao repositório original. Pull Requests são bem-vindos, mas voluntários.

A AGPL aplica-se somente ao material original que o projeto pode licenciar. Dependências, dados, áudios, vozes TTS e outros recursos de terceiros mantêm suas próprias licenças e termos. Consulte o texto oficial em <https://www.gnu.org/licenses/agpl-3.0.html> e os [avisos de terceiros](THIRD_PARTY_NOTICES.md).

## Como citar

Não é necessário citar o projeto para usá-lo normalmente. A citação é muito bem-vinda quando ele servir de referência, base, exemplo, ferramenta de pesquisa, recurso acadêmico, material de ensino ou ponto de partida para outro trabalho.

No GitHub, abra a página do repositório e use **Cite this repository**. O arquivo [CITATION.cff](CITATION.cff) fornece os metadados. Uma forma simples é:

> Mecabô, Rafael Fernando dos Reis. *Pasi Mandarim*. Software de código aberto. Disponível em: https://github.com/ferreis/learning_Mandarin

## Contribuições

Contribuições de desenvolvimento, segurança, acessibilidade, UI/UX, conteúdo educacional, português brasileiro, mandarim, revisão linguística, pronúncia, Pinyin, dados, áudios licenciados, testes, documentação, TTS e performance são bem-vindas. Veja [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de fork, testes e Pull Request.

## Roadmap

O projeto prioriza revisão comunitária de conteúdo e fontes, melhoria de acessibilidade e expansão cuidadosa de exercícios com recursos cuja licença possa ser documentada. Itens não presentes nesta lista não devem ser interpretados como funcionalidade já implementada.
