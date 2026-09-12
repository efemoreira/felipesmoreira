# Roteiro das notas — o que fazer, critério por critério, para a nota subir

Data: 2026-09-11

Acompanha `avaliacao-e-plano-de-crescimento.md` (11/09). Aquele diz **o que
foi visto** e dá a nota; este diz **o que fazer para a nota subir**, critério
por critério, com o passo exato, o arquivo, o teste que prova e o esforço.
Quando a nota for refeita em 05/10 e 11/12, é por esta lista que se confere.

## Como usar

Cada critério tem uma ficha:

- **Hoje → 05/10 → 11/12**: a nota de agora e a nota que cada data deve
  alcançar se o que está escrito for feito.
- **Fazer**: os passos, na ordem, com arquivo.
- **Prova**: o teste ou a verificação que permite dar a nota nova sem
  discussão. Sem prova, a nota não sobe.
- **Esforço**: horas de trabalho de uma pessoa que conhece o repositório.
- **Item**: o número no plano de 11/09.

A nota de um critério só sobe quando **todos** os passos do degrau estão
feitos e a prova está verde. Meio feito é a nota de antes.

**Começa hoje, 11/09.** As datas 05/10 e 11/12 são quando a nota é refeita
**por inteiro**, com as sete visões; não são quando o trabalho começa. Cada
semana do calendário termina com uma **nota parcial**: só os critérios que a
semana tocou são refeitos, com a prova ao lado, e a geral é recalculada. Assim
o crescimento aparece semana a semana — e se uma semana não moveu a nota, o
problema aparece na hora, não em outubro.

## A conta honesta

Projeção com os mesmos pesos da avaliação (militância 20 · administração 20 ·
programação 15 · organização 15 · design 10 · edição 10 · entrada 10):

| Visão | Hoje | 05/10 | 11/12 |
| --- | --- | --- | --- |
| 1. Site de militância | 6,5 | 8,3 | 8,7 |
| 2. Design | 7,0 | 7,0 | 8,6 |
| 3. Programação | 7,0 | 7,7 | 8,5 |
| 4. Administração | 5,5 | 7,1 | 8,4 |
| 5. Ferramenta de edição | 7,0 | 7,4 | 8,2 |
| 6. Ferramenta de organização | 6,0 | 6,0 | 8,0 |
| 7. Entrada | 6,0 | 8,0 | 8,7 |
| **Geral** | **6,4** | **7,4** | **8,5** |

Duas coisas que a conta mostra e a avaliação não dizia:

1. **O horizonte A sozinho dá 7,1, não 7,5.** Os itens 1–11 sobem
   administração e militância, mas organização e entrada ficam paradas. Para
   chegar perto de 7,5 em 05/10 é preciso **puxar para setembro três itens
   que não tocam código de negócio** — 18 (docs), 24 (`/painel/ajuda`) e 25
   (`comece-aqui`). São documentação e uma tela nova só de leitura; não
   ferem a regra "não refatorar antes de 04/10". Com eles, 7,4. O 7,5 redondo
   depende do item 11 (medição) caber.
2. **Organização é a visão que mais demora**: os três critérios baixos
   (semana/mês, rastro, escala) só sobem em B e C. É normal — são as coisas
   que a campanha não pediu ainda. Não adianta forçar antes de 05/10.

---

## 1. Site de militância (peso 20%)

### 1.1 Funil desenhado — 9 → 9 → 9
Nada a fazer. Manter: um `accent` na home, toda rota indexável terminando em
`/queroajudar`. **Prova:** `grep -c 'accent: true' src/app/page.tsx` = 1.

### 1.2 Atribuição `?de=` — 9 → 9 → 9
Nada a fazer. **Prova:** `testes/contrato/origem.test.ts` verde.

### 1.3 Compartilhar nativo — 8 → 8 → 9
Sobe para 9 em B/C quando os três geradores de PNG (`kit/KitClient.tsx`,
`programacao/poster.ts`, `candidatos/colinha.ts`) usarem um `src/lib/cartaz.ts`
comum (item 34). **Prova:** os três importam de `@/lib/cartaz`; nenhum
carrega fonte por conta própria. **Esforço:** 6 h.

### 1.4 OG nas rotas-chave — 4 → 9 → 9 · item 3
**Fazer:**
1. `src/app/candidatos/opengraph-image.tsx` — copiar de
   `src/app/propostas/opengraph-image.tsx`; título "Em que número votar",
   subtítulo com a chapa e o número (`CHAPA.numero` de `features/missao/data.ts`).
2. `src/app/programacao/opengraph-image.tsx` — "Programação da semana", com
   o período de `semanaDe()`.
3. Em cada `page.tsx` indexável, `twitter: { title, description }` igual ao
   `openGraph` (hoje só `/queroajudar` faz).
4. `src/lib/ogCard.tsx`: carregar Alfa Slab One e Bitter pelo `fonts` do
   `ImageResponse` (ler o `.ttf` de `node_modules/@fontsource-*` ou de
   `public/fonts/` no build). Sem isso o cartão sai em sans do sistema.
**Prova:** `npm run build` gera `out/candidatos/opengraph-image.png` e
`out/programacao/opengraph-image.png`; abrir os dois e ver a fonte do site.
Colar a URL num chat do WhatsApp e ver a prévia. **Esforço:** 4 h.

### 1.5 Robustez de `/candidatos` — 5 → 9 → 9 · item 5
**Fazer:**
1. `src/data/candidatos.json` com a chapa e os candidatos publicados (mesmo
   formato que `api/candidatos.php` devolve).
2. `src/app/candidatos/page.tsx` passa `semente={candidatos}` para
   `CandidatosClient`, como `programacao/page.tsx` faz com `programacao.json`.
3. `CandidatosClient.tsx`: desenha a semente na primeira pintura; a API
   substitui quando responder; erro de rede mantém a semente.
4. `publish.yml`: nada — o JSON vai no bundle.
5. `SigaCandidatos.tsx` (home) recebe a mesma semente.
**Prova:** desligar a rede no DevTools e abrir `/candidatos` — a lista
aparece. Teste de contrato: `candidatos.json` valida contra o tipo de
`api/candidatos.ts`. **Esforço:** 4 h.

### 1.6 Medição — 1 → 6 → 8 · item 11
**Fazer (degrau para 6):**
1. `public/painel/api/sinal.php`: POST JSON `{rota, evento}`; `evento` de uma
   lista fechada (`abriu`, `compartilhou`, `abriu-presenca`,
   `enviou-inscricao`, `passo-2`, `passo-3`); `rota` de uma lista fechada
   (as do `sitemap.ts`); honeypot; `passou_do_limite('sinal')` de
   `limite-comum.php` com teto alto (600/h); grava **só contagem** em
   `dados/sinais.php` como `[dia][rota][evento] => n`, dentro de
   `com_trava()` (item 2). Nenhum IP, nenhum cookie, nenhum id.
2. `src/lib/api/sinal.ts`: `sinal(evento)` que usa `navigator.sendBeacon`
   com fallback `apiFetch`, e nunca lança.
3. Chamar em: `KitClient` (compartilhou), `CompartilharClient`
   (compartilhou), `colinha` (compartilhou), `PresencaClient` (abriu-presenca),
   `InscricaoClient` (passo-2, passo-3, enviou-inscricao), `layout.tsx`
   (abriu, uma vez por carga).
4. `leituras-semana.php`: bloco "O site" — por rota, abriu × compartilhou ×
   inscreveu, semana atual e anterior.
**Degrau para 8 (B):** `leituras` ganha aba "Site" com quatro semanas e a
conversão `abriu → enviou-inscricao` por rota; o post-mortem usa esses números.
**Prova:** `testes/acoes/sinal.test.ts` — POST válido soma 1; evento fora da
lista responde `{ok:false}` e não grava; `dados/sinais.php` não contém
nenhum dígito de telefone nem IP. **Esforço:** 8 h (6) + 4 h (8).

---

## 2. Design (peso 10%)

### 2.1 Identidade — 9 → 9 → 9
Nada a fazer. Manter `theme.ts` como fonte e `sombra.test.ts` verde.

### 2.2 Acessibilidade — 8 → 8 → 9 · item 22
**Fazer:** `testes/contrato/contraste.test.ts` — calcula a razão WCAG de toda
combinação texto/fundo usada em `C` (ink/paper, ink/cream, ink/gold,
cream/night, os cinzas de aulas e presença depois de virarem token) e exige
≥ 4,5 em texto ≤ 18 px. Corrigir o que falhar: subir a opacidade dos kickers
Elite de `.6` para `.75`, trocar `#8e877a` por um `C.cinza` que passe sobre
`night`. **Prova:** teste verde; Lighthouse "Accessibility" ≥ 95 na home,
`/queroajudar` e `/programacao`. **Esforço:** 6 h.

### 2.3 Disciplina de tokens — 5 → 5 → 8 · item 19
**Fazer:**
1. `theme.ts`: `BORDA_FINA = 2`, `bordaFina(cor)`; `C.cinza`, `C.cinzaClaro`
   (os `#8e877a`/`#b9b3a5` de aulas e presença); `HATCH` exportado.
2. Substituir as 52 ocorrências de `2px solid` por `bordaFina()`; as três
   paletas de erro por `C.erro`/`C.erroBorda`/`C.sombraErro`
   (`inscricao/estilos.ts`, `presenca/Pecas.tsx`); os `HATCH` locais dos sete
   arquivos pelo import.
3. `programacao/ProgramacaoClient.tsx` e `CompartilharClient.tsx` importam
   `FONT_*` de `@/lib/theme`; `programacao/tipos.ts` deixa de reexportar.
4. `sombra.test.ts` (ou um `tema.test.ts` novo): fora de `theme.ts`,
   `ogCard.tsx`, `layout.tsx`, `manifest.ts` e do Estúdio, nenhum `#rrggbb`,
   nenhum `2px solid`, nenhum `const HATCH`.
**Prova:** o teste do passo 4 verde; `grep -rn '2px solid' src --include=*.ts*
| grep -v estudio` vazio. **Esforço:** 8 h.

### 2.4 Componentização — 4 → 4 → 8 · itens 19–20
**Fazer:**
1. `src/components/Voltar.tsx` (substitui os 13 "Voltar" locais),
   `src/components/FundoCordel.tsx` (iframe + véu, usado por `page.tsx`,
   `not-found.tsx`, `ProgramacaoClient.tsx`), `src/components/Cartao.tsx`
   (o `.cordel-card` com hover/active/focus, hoje copiado em `page.tsx` e
   `not-found.tsx`).
2. `src/app/page.tsx` → `src/features/home/Home.tsx` + `data.ts` (perfil,
   cartões, redes); a page fica com metadata + `<Home />`.
3. `privacy`/`terms`: conteúdo para `features/legal/data.ts`.
4. `globals.css`: só `@font-face`/variáveis das fontes e o reset; sai
   `--background/--foreground`, `Arial`, e o `@import "tailwindcss"`.
   Remover `tailwindcss` e `@tailwindcss/postcss` do `package.json`;
   `postcss.config.mjs` fica vazio ou some. O Estúdio passa a usar
   `var(--font-geist-mono)` direto.
**Prova:** `npm run build` e `npm run lint` verdes; `grep -rn 'href="/"' src
--include=*.tsx | grep -v Voltar` só na navegação; `package.json` sem
`tailwind`. **Esforço:** 12 h.

### 2.5 Peso e performance — 9 → 9 → 9
Nada a fazer. Manter: nenhuma imagem pública > 100 KB (`find public -size
+100k -not -path '*/modelos/*' -not -path '*/painel/*'` vazio).

---

## 3. Programação (peso 15%)

### 3.1 Arquitetura — 9 → 9 → 9
Manter. `eventos-comum.php` abaixo de 800 linhas quando for tocado de novo.

### 3.2 Testes — 9 → 9 → 9
Manter os três tipos e a regra "POST crítico pede teste de ação".

### 3.3 Concorrência — 3 → 8 → 9 · item 2
**Fazer (degrau para 8):**
1. `sessao.php`, ao lado de `gravar_atomico()`:
   ```php
   function com_trava(string $arquivo, callable $fn) {
       $h = fopen($arquivo . '.lock', 'c'); flock($h, LOCK_EX);
       try { return $fn(); } finally { flock($h, LOCK_UN); fclose($h); }
   }
   ```
   `.lock` dentro de `/dados`, coberto pelo `.htaccess` de `preparar_pastas()`.
2. Envolver ler→alterar→gravar em: `api/presenca.php` (pessoa **e**
   presença sob a mesma trava — `ARQ_PESSOAS`), `api/inscricao.php`,
   `api/escala.php`, `marcar_acesso()`, `registrar_envio()`,
   `registrar_postagem()`, `gravar_progresso()`.
3. `testes/acoes/concorrencia.test.ts`: 20 `postar()` em paralelo
   (`Promise.all`) em `api/presenca.php` com telefones distintos → 20
   presenças em `presencas.php` e 20 pessoas novas; 20 POSTs com o **mesmo**
   telefone → 1 pessoa, 1 presença.
**Degrau para 9 (B):** toda `gravar_*()` do painel passa por `com_trava()`,
e o teste de contrato exige: nenhuma chamada a `gravar_atomico()` fora de
`sessao.php`/`pessoas-modelo.php`/`*-comum.php` sem trava. **Prova:** os dois
testes verdes. **Esforço:** 8 h + 4 h.

### 3.4 CI — 5 → 5 → 8 · item 17
**Fazer:**
1. `publish.yml`: `npm ci`; passos `npm run lint` e `npm run test:tipos`
   antes de `npm test`; `actions/setup-node@v4` com `node-version-file:
   .nvmrc`; `shivammathur/setup-php@v2` com `php-version: '8.3'`
   (pinar o que a Hostinger roda — conferir em `/painel/manutencao`).
2. Segundo workflow `verificar.yml` em `pull_request`: mesmos passos, sem
   publicar.
3. `.nvmrc` = `24`; `package.json` `engines.node = ">=24"`.
4. `docs/deploy-testes-e-limites.md`: "PHP mínimo 8.1 (`: never`)"; corrigir
   `api/inscricao.php:21`.
**Prova:** um PR com `console.log` solto falha no lint; `git log origin/build`
mostra build só de `main`. **Esforço:** 4 h.

### 3.5 Docs × código — 6 → 8 → 9 · item 18 (puxar para setembro)
**Fazer:** fechar as dez divergências listadas na avaliação §3, uma por
commit curto: `dominio.php:44-50` (parágrafo duplicado), `conta.php:10`
(`usuarios.php` → `pessoas.php?p=&aba=acesso`), `api/aulas.php:13` e
`aulas-conteudo.php:27` (currículo vai para toda conta), `docs/dominio-e-fluxos.md`
(endpoints públicos são cinco; `apiFetch` tem uma exceção — ou fechar a
exceção, ver 3.6), `docs/site-publico.md` (a home é exceção; tema tem
divergências até o item 19), `docs/painel-ui-e-permissoes.md` (a regra de
telefone é a de `privacidade.php` + `gente.php`; "Área nova exige" ganha
`desenhar_barra_celular` e `pendencias_*`), `docs/deploy-testes-e-limites.md`
(`.htaccess` de `/dados` em runtime; cron de backup; as três cópias do
`publish.yml`; a branch `build`). `layout.php:311`: `desenhar_barra_celular`
lê `ORDEM_AGORA`/`GRUPOS_NAV` em vez da lista fixa.
**Degrau para 9 (B):** `testes/contrato/docs.test.ts` — todo arquivo citado
em crase nos docs existe no disco; toda URL de `docs/painel.md` tem
`RewriteRule` em `publish.yml`. **Prova:** teste verde. **Esforço:** 5 h + 2 h.

### 3.6 Contrato Next ↔ PHP — 7 → 7 → 8
**Fazer:** `InscricaoClient.tsx:232` passa a usar `apiFetch` (o
`ApiError` já preserva o corpo com `erro`); `src/lib/api/inscricao.ts` nasce
como os outros wrappers; apagar `api/sessao.ts` se continuar sem consumidor
(ou usá-lo no `/aulas`, que hoje descobre a sessão por conta própria).
`testes/contrato/inscricao.test.ts` ganha: nenhum `fetch(` em
`src/features/**` fora de `programacao` (que lê JSON estático). **Prova:**
teste verde. **Esforço:** 3 h.

---

## 4. Administração (peso 20%)

### 4.1 Autenticação — 8 → 9 → 9 · item 6
**Fazer:**
1. `index-acoes.php`: as tentativas passam a contar por `login` **e** por
   `chave_visitante()`; a conta só trava quando o mesmo IP errou 5×; um IP
   que erra 15× em contas diferentes trava o IP por 15 min. Estrutura em
   `dados/tentativas.php`: `['login' => [...], 'ip' => [...]]`.
2. `limite-comum.php` `chave_visitante()`: só lê `X-Forwarded-For` se
   `REMOTE_ADDR` estiver em `PROXIES_CONFIAVEIS` (constante com a faixa da
   Hostinger, conferida em `manutencao.php` que mostra os dois valores);
   senão usa `REMOTE_ADDR`.
**Prova:** `testes/acoes/login.test.ts` — 5 erros de um IP travam a conta
para esse IP e não para outro; header forjado sem proxy é ignorado.
**Esforço:** 4 h.

### 4.2 CSRF e escape — 9 → 9 → 9
Manter. `testes/contrato/painel.test.ts` já prende `exigir_token_de_acao()`.

### 4.3 Permissão real — 3 → 9 → 9 · item 1
**Fazer:**
1. `pessoas.php:34` e `caixa.php:22`: `exigir_admin()`.
2. `pessoas-acoes.php` `areas_do_post()`: `array_diff` com
   `['pessoas', 'caixa']`; `pessoas-ficha.php:171` e `inscricoes-fila.php:229`
   não desenham essas duas no ajuste fino.
3. `pessoas-modelo.php` `normalizar_pessoa()`: quem não tem `adm` perde
   `pessoas` e `caixa` de `areas` na gravação — assim o dado antigo se
   corrige sozinho na próxima escrita.
4. `dominio.php:44-50`: um parágrafo só, dizendo que a trava é
   `exigir_admin()` e a normalização.
**Prova:** `testes/acoes/pessoas.test.ts` — conta com `areas=['pessoas']` e
sem `adm`: GET `/painel/pessoas.php` redireciona com `?negado=`; POST `salvar`
com `capacidades[]=adm` na própria ficha não grava; `testes/fumaca/acessos.test.ts`
ganha o mesmo para `caixa`. **Esforço:** 4 h.

### 4.4 Integridade do dado — 3 → 8 → 9
Mesmo trabalho de 3.3. Sobe junto.

### 4.5 Backup — 7 → 8 → 9 · item 8
**Fazer (8):** `manutencao.php`: "zerar" chama `fazer_backup()` e aborta com
recado se o zip não foi gravado. **(9, C item 35):** cron que confere zip
< 36 h e avisa por e-mail; botão "Restaurar deste backup" em Manutenção
(descompacta em `dados/`, com backup do estado atual antes — a mesma função).
**Prova:** `backup.test.ts` ganha "zerar sem espaço em disco não apaga nada"
(simular `PASTA_BACKUP` sem permissão de escrita). **Esforço:** 2 h + 6 h.

### 4.6 Observabilidade — 2 → 2 → 7 · item 35
**Fazer (C):**
1. `sessao.php`: `set_error_handler`/`set_exception_handler` que gravam em
   `dados/erros.log` (uma linha JSON: data, arquivo, linha, mensagem, rota,
   uid) com rotação semanal por `fazer_backup()`; `display_errors` off.
2. `manutencao.php`: bloco "Erros dos últimos 7 dias" lendo o log.
3. Uptime externo (UptimeRobot ou similar, gratuito) em `/` e
   `/painel/api/sessao.php`; o e-mail de alerta vai para a coordenação.
4. `backup.php` (cron): ao terminar, `touch dados/backups/.ultimo`;
   `manutencao.php` mostra a data e pinta de vermelho se > 36 h.
**Prova:** forçar um `trigger_error` num teste de fumaça e ver a linha no log;
derrubar o site de propósito por um minuto e receber o alerta. **Esforço:** 8 h.

### 4.7 LGPD — 5 → 5 → 8 · item 16
**Fazer (B):**
1. `pessoas-ficha.php`, aba Acesso: "Exportar os dados desta pessoa" (JSON
   com a ficha, as presenças, o progresso, os lançamentos que a citam) e
   "Apagar a pedido" (tombstone do item 14: `apagadoEm`, `apagadoPor`,
   `motivo = 'pedido'`; nome vira "Pessoa removida"; telefone e e-mail
   zerados; presenças ficam anônimas).
2. `pessoas-acoes.php:156`: a senha provisória não passa por `$_SESSION`; vai
   para o recado da mesma resposta via `recado_pendente()` e some.
3. `/privacy`: parágrafo com o e-mail para exercer os direitos e o prazo.
**Prova:** `testes/acoes/lgpd.test.ts` — exportar devolve JSON com as
presenças da pessoa; apagar a pedido remove telefone e mantém a presença
contada no encontro; `grep senha_nova public/painel` vazio. **Esforço:** 8 h.

---

## 5. Ferramenta de edição (peso 10%)

### 5.1 Agenda — 9 → 9 → 9
Manter. Confirmar que `agenda importar` (legado) ainda é usado; se não, tirar
em B (menos código, mesma nota).

### 5.2 Fatos → produção — 9 → 9 → 9
Manter.

### 5.3 Aulas — 4 → 4 → 7 · item 26
**Fazer (C):**
1. `dados/aulas-texto.php`: `[dia][aula][bloco] => ['texto' => …,
   'alteradoEm', 'alteradoPor']`.
2. `aulas-comum.php` `curriculo_vigente()`: `CURRICULO` com o patch aplicado
   bloco a bloco; `api/aulas.php` e `aulas-tela.php` passam a chamar isso.
3. `/painel/aulas?aba=conteudo`: cada bloco de texto ganha "editar" (modal
   com `textarea`, `data-rascunho`), só `coordenacao`; blocos com patch
   mostram "editado por X em Y" e "voltar ao original".
4. `manutencao.php`: "Consolidar textos das aulas" gera o PHP do `CURRICULO`
   já com os patches, para colar em `aulas-conteudo.php` e zerar o arquivo.
**Prova:** `testes/acoes/aulas.test.ts` — editar um bloco muda o que
`api/aulas.php` devolve e não muda `aulas-conteudo.php`; "voltar ao original"
apaga o patch. **Esforço:** 12 h.

### 5.4 Estúdio — 7 → 7 → 8 · item 22
**Fazer:** `testes/fumaca/estudio.test.ts` — `estudio.php` responde 200 com
`window.__PAINEL__` carimbado para quem tem `estudio` e 302 para quem não
tem; `out/painel/estudio.html` existe depois do build e não é servido direto
(`.htaccess`). Um teste unitário em `src/app/painel/estudio/` para
`modelos.ts` (o maior arquivo puro). Tirar os 3 `eslint-disable` de hooks.
**Prova:** testes verdes; `grep -rn eslint-disable src/app/painel/estudio`
vazio. **Esforço:** 6 h.

### 5.5 Rascunho — 6 → 8 → 8 · item 9
**Fazer:** `data-rascunho` em `fatos-form.php` e em `pessoas-ficha.php`
(formulário de edição). **Prova:** `testes/contrato/mobile.test.ts` (ou um
`rascunho.test.ts`) — todo `<form>` com mais de 4 campos de texto no painel
tem `data-rascunho`. **Esforço:** 1 h.

---

## 6. Ferramenta de organização (peso 15%)

### 6.1 Modelo de dado — 9 → 9 → 9
Manter. `normalizar_pessoa()` continua sendo o schema.

### 6.2 Rotina do dia — 8 → 8 → 9 · item 32
**Fazer (C):** `caixa`, `candidatos`, `aulas`, `municao`, `leituras` declaram
`estado_*()` (uma linha na mesa: "3 lançamentos esta semana", "2 candidatos
sem número", "peça da semana: escolhida/faltando"); `painel.test.ts` exige
`estado_<area>()` para toda área em `ORDEM_AGORA`. **Prova:** teste verde.
**Esforço:** 4 h.

### 6.3 Rotina da semana e do mês — 3 → 3 → 7 · itens 13, 27, 28, 30
**Fazer:**
- **(5, B) Exportar CSV**, item 13: `exportar.php` + `exportar-comum.php`;
  `?o=pessoas&tipo=…&cidade=…` (mesmos filtros de `pessoas-lista.php`),
  `?o=presencas&evento=…`, `?o=caixa&conta=…`; UTF-8 com BOM; telefone com
  aspas; só `adm`/`coordenacao`; botão nas três telas.
  **Prova:** `testes/acoes/exportar.test.ts` — linhas = registros filtrados,
  cabeçalho fixo, nada gravado, quem não tem capacidade recebe 302.
  **Esforço:** 6 h.
- **(6, C) Metas**, item 27: `dados/metas.php`; `medidores_*` com `alvo`
  mostram "x de y" em Leituras › Semana e no hub; edição em Leituras
  (`coordenacao`). **Prova:** `leituras.test.ts` — meta gravada aparece no
  medidor; GET continua sem gravar. **Esforço:** 6 h.
- **(7, C) Tarefas**, item 28: `dados/tarefas.php` (`titulo`, `dono`, `ate`,
  `evento?`, `feitoEm`); `pendencias_tarefas()` no `ORDEM_AGORA`; aba
  "Tarefas" em Encontros (do encontro) e em Gente ("o que pedi"); criar,
  concluir, reatribuir. **Prova:** `testes/acoes/tarefas.test.ts` — tarefa
  vencida aparece na fila do dono e não na de outro. **Esforço:** 10 h.
- **(7, C) Importar**, item 30: `importar.php`, só `adm`: CSV → prévia com
  `duplicatas_de_pessoas()` contra a base → escolher por linha (nova ·
  juntar · pular) → gravar em lote com `status='pendente'` ou direto.
  **Prova:** `importar.test.ts` — arquivo com 3 linhas, 1 duplicata: grava 2,
  sugere 1. **Esforço:** 10 h.

### 6.4 Rastro — 3 → 3 → 8 · item 14
**Fazer (B):**
1. `normalizar_pessoa()`, `normalizar_evento()`, `normalizar_lancamento()`
   ganham `alteradoEm`/`alteradoPor`; `gravar_pessoas()` etc. preenchem a
   partir de `usuario_atual()` só nos registros que mudaram (comparar com o
   lido).
2. Apagar pessoa e lançamento vira tombstone (`apagadoEm`, `apagadoPor`);
   listas filtram; `linha_do_tempo()` lê `alteradoEm` e `apagadoEm` como
   eventos ("ficha alterada por X", "apagada por Y").
3. `juntar_pessoas()` registra `juntadaEm`/`juntadaCom`.
**Prova:** `testes/acoes/pessoas.test.ts` — salvar ficha grava `alteradoPor` =
uid da sessão; apagar mantém o registro com `apagadoEm` e a lista não o mostra;
`fumaca/atividade.test.ts` vê "apagada por". **Esforço:** 8 h.
**Degrau para 9:** aposta 2 (pessoa como linha do tempo), se provar.

### 6.5 Escala e convite — 6 → 6 → 8 · item 29
**Fazer (C):** `pessoas_escalaveis()` em `escala-comum.php` (militante ou
apoiador com telefone, com ou sem `usuario`); `escala_sugerida()` e a tela de
preparo usam ela; o convite por token já não pede login. `convites_sem_resposta()`
inclui os sem conta. **Prova:** `testes/acoes/eventos.test.ts` — pessoa sem
`usuario` entra na escala e responde "topo" pelo token. **Esforço:** 4 h.

---

## 7. Entrada (peso 10%)

### 7.1 Militante novo — 7 → 7 → 9 · item 23 + aposta 3
**Fazer (B, 8):** `index-hub.php`: se `trilha_de($u)` não está completa, a
tela é só três cartões (entrou no grupo · fez a aula · fez a primeira
ferramenta), cada um com o link certo e o estado, e "ver o painel inteiro";
`painel.test.ts` conta: militante recém-aprovado vê 3 cartões e 0 seções.
**(C, 9):** aposta 3 — o cordel que se preenche em `/aulas` e no hub.
**Prova:** teste de fumaça; em campo, uma pessoa nova diz o que faz primeiro
sem perguntar. **Esforço:** 6 h + 10 h.

### 7.2 Coordenação nova no painel — 5 → 8 → 8 · item 24 (puxar para setembro)
**Fazer:**
1. `ajuda-comum.php`: `AJUDA_AREA = ['fatos' => ['serve' => …, 'abre' => …,
   'sai' => …], …]` para as 12 áreas + `gente` + `conta`; `GLOSSARIO` com
   tipo/função/capacidade, mesa/leitura, pendente/aprovada/militante,
   origem, funil D+0/3/7, reativação.
2. `ajuda.php` (rota, `exigir_login()`): desenha por `GRUPOS_NAV`, só as
   áreas que a pessoa abre, mais o glossário; `RewriteRule` em `publish.yml`.
3. `cabecalho_pagina()` em `componentes.php`: subtítulo = `AJUDA_AREA[area]['serve']`.
4. Link "Ajuda" no rodapé do menu e na Conta.
**Prova:** `testes/contrato/painel.test.ts` — toda área em `AREAS` tem as três
frases; `fumaca/painel.test.ts` abre `ajuda.php` com cada capacidade.
**Esforço:** 6 h.

### 7.3 Desenvolvedor novo — 6 → 9 → 9 · item 25 (puxar para setembro)
**Fazer:**
1. `docs/comece-aqui.md` (≤ 150 linhas): pré-requisitos (Node 24, PHP ≥ 8.1),
   `npm install`, `npm run dev`, `npm run painel:local`, `npm test`, como
   publicar (push em `main` → CI → branch `build` → Hostinger puxa), o mapa
   de pastas em 10 linhas, o vocabulário em 10 linhas, o fluxo central em
   Mermaid (pessoa → presença → inscrição → aprovação → formação →
   militância → líder/núcleo), "sua primeira tarefa" apontando para os itens
   pequenos deste roteiro.
2. `testes/painel-local.ts` + script `painel:local` em `package.json`: chama
   `montarSandbox()`, roda `semear.php`, sobe `php -S 127.0.0.1:8081`, imprime
   login/senha do admin de teste e fica no ar até Ctrl-C.
3. `docs/arquitetura-referencia.md`: índice no topo "leia isto quando…", uma
   linha por seção.
4. `docs/dominio-e-fluxos.md` recebe o mesmo Mermaid.
**Prova:** uma pessoa que nunca abriu o repositório roda o painel local e
publica uma mudança de texto lendo só `comece-aqui.md` — cronometrar; meta
30 min. **Esforço:** 6 h.

---

## Calendário

Horas por semana assumidas: ~12 (é trabalho ao lado da campanha). Se houver
mais, a ordem não muda — o que muda é quanto de B cabe em setembro.

| Semana | Datas | O que | Critérios que sobem | Geral ao fim |
| --- | --- | --- | --- | --- |
| 0 | — | ponto de partida (11/09) | — | **6,4** |
| 1 | 11–17/09 | **Proteger.** ~~4.3 permissão (item 1)~~ · ~~3.3/4.4 concorrência (item 2)~~ · ~~4.5 backup antes de zerar (item 8)~~ · ~~`Cache-Control` no painel (item 7)~~ — **feitos em 11/09** · **decidir o texto do dia 05/10** (aposta 5) | permissão 3→9 · integridade 3→8 · concorrência 3→8 · backup 7→8 | **6,7** |
| 2 | 18–24/09 | **Converter.** ~~1.4 OG (item 3)~~ · ~~1.5 semente de candidatos (item 5)~~ · ~~"17 funções" (item 4)~~ · ~~5.5 rascunho em fatos (item 9)~~ · ~~4.1 tentativas por IP (item 6)~~ — **feitos em 11/09**, adiantados | OG 4→9 · robustez 5→9 · rascunho 6→8 · autenticação 8→9 | **7,0** |
| 3 | 25/09–01/10 | **Entrar e medir.** 7.3 `comece-aqui` + `painel:local` (item 25) · 7.2 `/painel/ajuda` (item 24) · 3.5 divergências dos docs (item 18) · 1.6 medição se couber (item 11) · **validação em campo** (item 10) no encontro da semana | dev 6→9 · coordenação 5→8 · docs 6→8 · medição 1→6 | **7,4** |
| — | 01–04/10 | **Congelado.** Reta final: só correção de erro visto em campo. Nada novo entra. | — | 7,4 |
| 4 | 05–11/10 | **Post-mortem** (item 12) com os números de Leituras e do `sinal.php` · **reavaliação completa** (ficha abaixo) · decidir apostas 4 e 6 · ligar aposta 5 | — | 7,4 |
| 5 | 12–18/10 | 6.3 exportar CSV (item 13) · 3.4 CI (item 17) · 3.6 `apiFetch` | semana/mês 3→5 · CI 5→8 · contrato 7→8 | 7,6 |
| 6 | 19–25/10 | 6.4 rastro (item 14) · 4.7 LGPD (item 16) | rastro 3→8 · LGPD 5→8 | 7,8 |
| 7 | 26/10–01/11 | `painel.js` + CSP (item 15) · 7.1 primeiros passos (item 23) · 5.4 teste do Estúdio · 2.2 contraste | militante 7→8 · estúdio 7→8 · a11y 8→9 | 7,9 |
| 8 | 02–08/11 | 2.3 tokens (item 19) · 2.4 componentes, home fina, Tailwind fora (itens 19–20) · semente da programação (21) · aposta 7 (Leituras que fala) | tokens 5→8 · componentização 4→8 | 8,1 |
| 9–10 | 09–22/11 | 4.6 observabilidade (item 35) · 6.2 áreas mudas (item 32) · 6.5 escala sem conta (item 29) · aposta 3 (cordel) | observabilidade 2→7 · dia 8→9 · escala 6→8 · militante 8→9 | 8,3 |
| 11–12 | 23/11–06/12 | 5.3 aulas editáveis (item 26) · 6.3 metas (item 27) · 6.3 tarefas (item 28) · aposta 6 (presença sem sinal) | aulas 4→7 · semana/mês 5→7 | 8,4 |
| 13 | 07–11/12 | 6.3 importar (item 30) · 1.3 gerador comum (item 34) · `CONTRIBUTING` (item 36) · **reavaliação completa** | compartilhar 8→9 | **8,5** |
| depois | dez → | aposta 1 (sem senha) · aposta 4 (núcleo) · aposta 2 (linha do tempo) · aposta 8 · item 31 território · item 33 índice | — | — |

Regras do calendário:

- **Nada de B em setembro além dos itens 18, 24 e 25** — são docs e tela
  nova só de leitura. O resto de B espera o dia 05, mesmo que sobre tempo.
- **Uma semana atrasada empurra as seguintes; não se pula.** A ordem é a
  ordem de quanto cada critério pesa na nota.
- **Toda semana termina com `npm test` verde e um commit por item.** Item
  sem teste não conta como feito.
- **Toda semana termina com a nota parcial escrita** — a coluna "Geral ao fim"
  é a projeção; a real vai ao lado dela, na tabela abaixo, com a data.

### Notas parciais (preencher ao fim de cada semana)

| Semana | Data | Critérios refeitos (nota · prova) | Geral real | Projetada |
| --- | --- | --- | --- | --- |
| 0 | 11/09 | ponto de partida | 6,4 | 6,4 |
| 1 | 11/09 | permissão 9 (`acoes/pessoas`) · integridade 8 (`acoes/concorrencia`) · concorrência 8 · backup 8 (`acoes/backup`) | 6,7 | 6,7 |
| 2 | 11/09 | OG 9 (`contrato/og`, cartões com Alfa Slab) · robustez 9 (chapa do build) · rascunho 8 · autenticação 9 (`acoes/login`) | 7,0 | 7,0 |
| 3 | | | | 7,4 |

---

## Ficha de reavaliação

Copiar esta tabela para o fim de `avaliacao-e-plano-de-crescimento.md` em
05/10 e em 11/12, preencher com os mesmos critérios, e escrever ao lado de
cada nota **a prova** que a justifica (o teste, o arquivo, o número).

```text
Reavaliação de __/__/2026 — feita por ________ — método: leitura de código e testes

1. Militância (20%)   funil __ · atribuição __ · compartilhar __ · OG __ · robustez __ · medição __   → __
2. Design (10%)       identidade __ · a11y __ · tokens __ · componentes __ · peso __                  → __
3. Programação (15%)  arquitetura __ · testes __ · concorrência __ · CI __ · docs __ · contrato __     → __
4. Administração (20%) auth __ · csrf __ · permissão __ · integridade __ · backup __ · observ. __ · LGPD __ → __
5. Edição (10%)       agenda __ · fatos __ · aulas __ · estúdio __ · rascunho __                      → __
6. Organização (15%)  modelo __ · dia __ · semana/mês __ · rastro __ · escala __                      → __
7. Entrada (10%)      militante __ · coordenação __ · dev __                                          → __

Geral (ponderada): __    Anterior: __    Meta desta data: __

O que subiu e por quê (uma linha por critério, com a prova):
-
O que não subiu e por quê:
-
O que a próxima data precisa:
-
```

A nota é honesta se três coisas forem verdade: a prova de cada critério
existe e está verde; ninguém arredondou "quase feito" para feito; e a pessoa
que deu a nota conseguiria defendê-la para alguém que não gosta do projeto.
