# Avisos de recursos de terceiros

Este arquivo não substitui as licenças originais. A AGPL-3.0-only do repositório não relicencia bibliotecas, dados, áudios ou serviços externos.

## Dependências npm

As dependências diretas atuais são Vue 3, Vite, `@vitejs/plugin-vue`, TypeScript, `vue-tsc` e Playwright. Suas versões exatas e licenças declaradas estão em `package-lock.json`; a maioria das dependências diretas declara MIT, e algumas dependências transitivas usam Apache-2.0, BSD, ISC ou MPL-2.0. Os avisos e textos aplicáveis pertencem aos respectivos pacotes no npm.

## audio-cmn / Shtooka

- Origem: <https://github.com/hugolpz/audio-cmn>
- Finalidade: catálogo remoto de sílabas humanas (`src/data/webAudioCatalog.ts`).
- Autoria/créditos declarados pela fonte: Chen Wang; Hugo Lopez, Nicolas Vion e colaboradores do projeto audio-cmn/Shtooka.
- Licença declarada pela fonte: CC BY-SA; a versão não é explicitada no catálogo usado.
- Situação: os MP3s desse acervo não são armazenados neste repositório; a aplicação aponta para URLs remotas. Antes de copiar, hospedar ou redistribuir arquivos, confirme a versão da licença e preserve atribuição e ShareAlike.

## Shtooka / Wikimedia Commons e arquivos Shtooka

- Origem: Wikimedia Commons e arquivos Shtooka/Yojik consultados por `scripts/sync-human-audio.mjs`.
- Finalidade: sílabas humanas complementares.
- Créditos: Wei Gao, Yue Tan e demais créditos registrados por arquivo.
- Licenças: o script aceita metadados Creative Commons; exemplos catalogados incluem CC BY 2.0 FR e CC BY-SA 3.0 US.
- Situação: cada gravação pode ter licença e atribuição próprias. Preserve os metadados individuais do catálogo e da página de origem.

## Sinosplice — Mandarin Chinese Tone Pair Drills

- Origem: <https://www.sinosplice.com/learn-chinese/tone-pair-drills>
- Finalidade: áudio humano e itens do treino de pares tonais.
- Autor/crédito indicado: John Pasden / Sinosplice.
- Licença indicada pela fonte: CC BY-NC-SA 2.5.
- Aviso: uso não comercial, atribuição e compartilhamento pela mesma licença são condições relevantes. Os MP3s gerados em `public/audio/tone-pairs/sinosplice/` não são versionados, mas são incluídos no artefato quando o workflow os baixa.

## Tatoeba

- Origem: <https://tatoeba.org/en/downloads>
- Finalidade: frases humanas em mandarim, transcrições e ligações com português.
- Licença: varia por sentença e gravação. O sincronizador aceita somente entradas com licença Creative Commons explícita e registra autor/licença por item.
- Aviso: `generatedSentenceCatalog.ts` é gerado e os MP3s não são versionados. Ao redistribuir o resultado, mantenha os dados de autoria/licença presentes em cada item e siga a licença específica.

## Hanzi Project

- Origem: <https://github.com/bluegreenstone/hanzi-project>, revisão `4abfad3fb256049481825f81ac64d5713e3ee31d`.
- Finalidade: registros estruturados dos 214 radicais Kangxi.
- Licenças: o corpus declara licenças específicas por fonte/campo, incluindo Unicode License v3, CC BY-SA 4.0, LGPL-3.0-or-later, Taiwan Open Government Data License 1.0, CC0 e termos específicos de ativos.
- Aviso: `generatedRadicals.ts` é derivado de uma parcela do corpus e recebe glosas/explicações em português criadas pelo projeto. Não trate o corpus inteiro como AGPL; consulte `sources.json`, os perfis de licença e a atribuição do Hanzi Project antes de redistribuir dados derivados.

## Referências fonéticas e deck Anki

- University of Iowa e Ohio State são citadas como referências de fonética em `src/data/initialPronunciation.ts` e `README_PRONUNCIATION_GUIDE.md`; seus materiais não são copiados para este repositório.
- Um deck Anki foi analisado somente como referência de estrutura pedagógica. Seu HTML e imagens não foram incorporados porque a licença não foi confirmada.

## TTS por edge-tts e vozes Microsoft

- Ferramenta: <https://github.com/rany2/edge-tts>.
- Finalidade: pré-gerar MP3s locais para os modos TTS dos flashcards.
- Serviço/vozes: Microsoft Edge Read Aloud/Speech; `zh-CN-XiaoxiaoNeural`, `zh-CN-YunxiNeural` e `zh-CN-XiaoyiNeural`.
- Licença/permissão de redistribuição do áudio gerado: não confirmada por este repositório.
- Aviso: antes de publicar em larga escala os MP3s gerados, confirme os termos aplicáveis da Microsoft. Esses arquivos não são áudio humano e não recebem automaticamente a AGPL.
