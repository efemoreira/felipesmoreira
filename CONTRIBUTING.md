# Contribuir

Este repositório tem um autor. Este arquivo existe para que possa ter dois.

## Antes de tudo

Leia `docs/comece-aqui.md` — trinta minutos: rodar, testar, publicar, o
vocabulário, o fluxo central. O `CLAUDE.md` é o guia normativo curto; os
docs em `docs/` são por tema. Não é preciso ler `docs/arquitetura-referencia.md`
inteiro: o índice no topo diz quando cada seção interessa.

## O ciclo

1. Um item por vez, do `update/roteiro-das-notas.md` ou de um problema visto
   em campo. Antes de começar, confira se o achado ainda vale: quatro dos
   achados das avaliações caíram ao serem executados, e estão marcados lá.
2. `npm test` verde antes de escrever, verde depois. Item sem teste não
   conta como feito: POST crítico pede teste de ação; par PHP/TS pede
   contrato; tela grande refatorada pede fumaça.
3. Um commit por item. A mensagem diz **o que doía e por que ficou assim** —
   o "o quê" está no diff. Em português.
4. `git push` em `main` publica (`publish.yml` → branch `build` → Hostinger).
   `verificar.yml` roda lint, tipos e a suíte em todo push e PR, em PHP 8.1.
   Se qualquer um dos dois ficar vermelho, é seu até ficar verde.

## As regras que os testes cobram

- Toda chamada do site ao painel passa por `apiFetch` (`src/lib/api/`).
- Cor, borda, sombra e fonte saem de `src/lib/theme.ts`
  (`contrato/tema.test.ts`, `contrato/sombra.test.ts`).
- Classe nova no painel exige regra no `painel.css`; `style=` inline tem
  teto (`contrato/estilo.test.ts`). Ao mexer no CSS ou no `painel.js`, suba
  `VERSAO_ESTILO` em `layout.php`.
- Nada de `onsubmit=`/`onclick=` inline: `data-confirmar`,
  `data-envia-ao-mudar`, e `nonce="<?= h(nonce_csp()) ?>"` em `<script>`
  inline (`acoes/cabecalhos.test.ts`).
- Todo ler→alterar→gravar que o público ou muita gente dispara passa por
  `com_trava()` e relê dentro dela (`acoes/concorrencia.test.ts`).
- Apagar pessoa ou lançamento é `apagar_pessoa()` / `apagar_lancamento()`
  — a lápide fica; `array_filter` no arquivo não.
- Área nova: `AREAS`, `DESTINO_AREA`, `GRUPOS_NAV`, `ROTULO_CURTO`, ícone,
  `RewriteRule` em `publish.yml`, frase em `SAI_DE_AREA` (Ajuda), e
  `pendencias_*()` no `-comum.php` (`contrato/painel.test.ts` lista o que
  faltou).
- Documento cita arquivo que existe e URL que tem regra
  (`contrato/docs.test.ts`).

## O que não mexer sem alinhar

`next.config.ts`, `publish.yml` (fora `RewriteRule` de rota nova), os
`.htaccess` gerados, `conceito.html`, e os nomes `kit-*`/`api/kit.php`/`/kit`.

## Dado pessoal

`public/dados/` não entra no git. O sandbox dos testes semeia o próprio.
Nunca cole telefone, e-mail ou nome real de militante em teste, commit ou
issue.
