# felipesmoreira.com

Guia curto do repositório. O detalhamento que antes vivia inteiro aqui foi
movido para docs para reduzir custo de contexto no início das sessões.

## Onde ler o detalhe

- `docs/arquitetura-completa.md` — mapa curto da arquitetura.
- `docs/arquitetura-referencia.md` — referência longa/histórica, quando o rational completo importar.
- `docs/painel.md` — operação do painel PHP, dados e fluxos administrativos.

Quando uma tarefa tocar uma dessas frentes, leia o doc correspondente em vez de
reexpandir tudo neste arquivo.

## Arquitetura-base

- **Site público:** Next.js 15 App Router com `output: "export"`.
- **Backend real:** PHP em `public/painel/`.
- **Não existe** `app/api` para lógica dinâmica do produto.
- **Hospedagem:** build estático servido pela Hostinger/Apache; o painel PHP roda ao lado.
- **Tailwind v4** está instalado, mas a identidade do site **não** é utilitária por padrão; o eixo visual sai de `src/lib/theme.ts`.

## Estrutura do front

```text
src/
  app/                 rotas finas
  features/<nome>/     UI, estado, dados e fluxo por área
  components/          primitivas compartilhadas
  lib/                 tema, helpers, clientes de API
  data/                JSON estático versionado
```

Regras:

- `src/app/<rota>/page.tsx` deve ser fino: metadata + delegação para a feature.
- Estado, efeitos e UI mais densa ficam em `src/features/`.
- Dados de conteúdo ficam em `features/<nome>/data.ts` quando fizer sentido.
- Exceção explícita: `src/app/painel/estudio/` é um produto à parte e não serve de modelo para páginas comuns.

## Tema e identidade

- Cor, fonte, moldura e escala de texto saem de `@/lib/theme`.
- Use `C`, `FONT_ALFA`, `FONT_ELITE`, `FONT_BITTER`, `BORDA`/`borda()` e `TEXTO`.
- Não crie nova paleta local nem escreva `3px solid` à mão.
- **A sombra dura sai de `sombra()`**, com `sombraErguida()`/`sombraAfundada()` para hover e clique.
- A escala é `SOMBRA` — `rente` (3), `cartao` (5), `alto` (8). Opacidade é uma só (`C.sombra`); quem carrega a altura é o deslocamento. Cor é decisão da peça, como em `borda()` (`C.sombraNoite` sobre fundo escuro, `C.sombraErro` no campo com erro).

## Contrato Next ↔ PHP

- Toda chamada do lado Next para o painel passa por `@/lib/api/client.ts` (`apiFetch`).
- Endpoint novo do painel:
  1. reaproveita `sessao.php`;
  2. responde JSON com `Content-Type` correto;
  3. usa `Cache-Control: no-store, private` quando aplicável;
  4. prefere estado no corpo em vez de usar status HTTP para erro esperado.
- Endpoints públicos atuais: inscrição e presença. Eles não usam CSRF; usam honeypot, teto, origem e validações de fluxo.

## Regras centrais do produto

### Pessoas e permissões

- A base unificada é `dados/pessoas.php`.
- Não recrie cadastros paralelos.
- `tipo` != `funcoes` != `capacidades`.
- `pessoas` é área com dado pessoal e fica restrita à administração.
- Telefone é chave natural de reconciliação; presença é relação, não cópia.

### Inscrição e presença

- `/queroajudar` cria ou reaproveita uma **pessoa** com `status = 'pendente'`; não cria conta.
- Aprovar inscrição **dá conta à ficha existente**, com senha provisória e `trocarSenha = true`.
- `/presenca` trabalha com dois tokens: um para confirmação e outro para presença na porta.
- A passagem `/presenca` → `/queroajudar` usa `sessionStorage` (`CHAVE_RASCUNHO`), nunca querystring para telefone.
- `slugDe()` (TS) e `normalizar_origem()` (PHP) têm de concordar.
- O cartão do link (WhatsApp) de `/presenca` sai de `api/presenca-previa.php`: o
  `.htaccess` desvia **só o robô de prévia** para lá, e o navegador continua
  recebendo o HTML estático. Título e descrição do encontro vivem lá; o que está
  em `app/presenca/page.tsx` é o plano B.

### Agenda e encontros

- A programação pública vem dos encontros; `agenda.php` edita a capa e espelha o que está em `eventos`.
- Toda conta de tempo sai de `inicio`, nunca de `data` — inclusive a de "já aconteceu", que é `evento_ja_aconteceu()`. **Cancelado não é passado:** encontro cancelado com data futura continua entre os que ainda vão acontecer, marcado.
- A semana corrente vai de **segunda a domingo**, no fuso do Ceará. `semana_de()`/`dia_de()` (PHP) e `semanaDe()`/`diaDe()` (TS) têm de concordar — `testes/contrato/semana.test.ts` prende o par. O período da capa da programação é calculado daí quando o campo do painel está vazio.
- `estado_do_evento()` (PHP) e `estadoDe()` (TS) têm de concordar.
- Publicação da agenda acontece ao gravar, não por botão separado.

### Candidatos, colinha e número

- Candidato e lista são perguntas diferentes.
- `CARGOS` em `sessao.php` é a fonte dos cargos e dos dígitos do número.
- Sem número válido não publica.
- A ordem da lista é a ordem da colinha.
- Vice e suplente usam os dígitos do titular.

### Munição e atribuição

- `/municao` é ferramenta interna/noindex.
- A rota antiga `/kit` continua por compatibilidade.
- Os arquivos internos `kit-*` e `api/kit.php` não devem ser renomeados sem ganho real.
- O `?de=` fecha a atribuição das peças.

### Formação

- O conteúdo das aulas fica em PHP (`public/painel/aulas-conteudo.php`), não em `src/`, para não ir para o bundle público.
- `/aulas` lê pela API do painel.
- `checklists.php` é fonte única dos “Pronto quando”.
- `trilhas.php` é fonte única da trilha mínima por função — a aula, o checklist e a primeira ferramenta. Não escreva uma quarta lista ligando função a aula.

## Convenções do painel

- Navegação mora em `layout.php`, e só lá.
- Telas grandes seguem, por padrão:

```text
<area>.php          rota
<area>-acoes.php    POST
<area>-tela.php     tela principal
<area>-comum.php    modelo/regras
```

- Cada módulo inclui o que usa com `require_once`; não dependa da ordem de include da rota.
- Use os helpers compartilhados quando houver:
  - `barra_abas()`
  - `barra_busca()`
  - `barra_filtros()`
  - `botao_modal()` / `abrir_modal()` / `fechar_modal()`
  - `menu_acoes()` — os três pontinhos da linha de lista
- Formulário longo no painel usa `data-rascunho`; o rascunho nunca se aplica sozinho.
- A linha do tempo é derivada dos carimbos existentes; não crie `dados/atividade.php`.

## Mobile first

- O site e o painel precisam funcionar bem em celular.
- Priorize **scroll vertical apenas** nas telas de trabalho.
- Tabelas operacionais no painel são suspeitas: se escondem ação ou contexto no celular, devem virar cards/listas.
- **Duas listas continuam em abas; o que se empilha são os ITENS de uma lista.** Item que é link (nome, data, um estado) vira pilha vertical com respiro entre os cartões — `.area-cartao` no `painel.css`, nunca `<a>`/`<span>` sem estilo, que saem inline e grudam um no outro. Lista que cresce sem parar ganha teto, com a legenda contando o total e a busca alcançando o resto (ver `eventos-lista.php`). Bloco que é conteúdo — ficha, formulário longo, registro com motivo — nunca fica embaixo de outro: vira aba (ver `fatos-tela.php`, `aulas-tela.php`).
- **Classe nova no painel exige regra no `painel.css`.** `<a>` e `<span>` são inline: classe sem CSS não quebra nada — a tela desenha, o teste de fumaça passa — e a lista sai como parágrafo corrido. `testes/contrato/estilo.test.ts` prende isso. Ao mexer no CSS, suba `VERSAO_ESTILO` em `layout.php`.
- **Toda tabela do painel mora em `<div class="rolagem cartoes">`.** `.rolagem` segura o desktop; `.cartoes` desmonta a tabela em cartões abaixo de 700 px. Cada `<td>` leva `data-rotulo` com o texto do `<th>` — no cartão não há cabeçalho para olhar. `.meia`/`.terco` põem blocos lado a lado, `.tarde` desce o secundário e `.rodape` separa as ações. Um HTML só: não escreva uma segunda árvore para o celular.
- Ações dentro de uma célula vão em `<div class="acoes-celula">`, não em `<form style="display:inline">`.
- **Duas ações ou mais na linha viram menu**: `menu_acoes()` desenha os três pontinhos e guarda os itens (links, POSTs com csrf, item de risco). Um botão visível por linha é o teto — `testes/contrato/mobile.test.ts` prende a regra.
- `testes/contrato/mobile.test.ts` prende a regra — tabela nova sem `cartoes` quebra o teste.
- Alvo mínimo de toque: 44 px.
- No site público, inputs ficam com mínimo de 16 px para evitar zoom do Safari.

## Testes

- `npm test` roda contrato + ações + fumaça.
- `npm run test:tipos` roda `tsc --noEmit` na raiz e em `testes/`.
- `npm run lint` deve ficar limpo.

Tipos de teste:

- `testes/contrato/` — pares PHP x TS e fontes únicas.
- `testes/acoes/` — gravação e redirecionamento do painel.
- `testes/fumaca/` — tela inteira, em silêncio.

Regras:

- Par novo PHP/TS pede teste de contrato.
- POST crítico pede teste de ação.
- Tela grande refatorada pede fumaça, no mínimo.

## O que não mexer sem perguntar

- `next.config.ts` com `output: "export"`.
- `.github/workflows/publish.yml` e a lógica de publicação/`.htaccess`.
- `conceito.html`.

## Imagens

- `public/` vai para o build sem otimização do Next.
- Confira peso antes de colocar imagem em `public/`.
- Originais ficam em `originais/`.

## Convenções finais

- Rotas e conteúdo: português.
- Identificadores de código: português, acompanhando a base atual.
- Ao mexer em slug/nome de arquivo, use `sem_acento()` no PHP e `normalize("NFD")` no JS.

Se uma tarefa exigir o porquê detalhado, os exemplos históricos ou o rational
completo, leia `docs/arquitetura-referencia.md`.