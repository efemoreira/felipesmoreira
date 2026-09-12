# Segunda avaliação — o que mudou, o que ainda dói, o que apareceu

Data: 2026-09-12 (a primeira foi 11/09; esta refaz a leitura com o mesmo
método e os mesmos critérios, mais quatro olhares que a primeira não teve).

## O que mudou em um dia

30 commits sobre `main` desde a primeira avaliação. Em números:

| | 11/09 | 12/09 |
| --- | --- | --- |
| Testes | 339 | **495** (contrato 136 · ações 250 · fumaça 109) |
| Tempo de `npm test` | ~40 s | 63 s (8 workers de PHP, paralelismo real) |
| Itens do plano feitos | 0 de 36 | **17** (todo o horizonte A de código + 17, 18, 21, 22, 25 de B) |
| Endpoints públicos com tranca de gravação | 0 | 3 + os quatro gravadores frequentes |
| Rotas com cartão OG próprio | 5 de 8 | 8 de 8, com as fontes do site |
| Workflows de CI | 1 (publica, sem lint) | 2 (`verificar.yml` com lint, tipos, PHP 8.1) |
| Docs de entrada | 0 | `comece-aqui.md`, `/painel/ajuda`, `painel:local` |
| Bugs reais achados pelos testes novos | — | 2 (abas da ficha voltavam à lista; teste "de hoje" vermelho à tarde) |

O que **não** mudou, por decisão: nada de produto novo (CSV, rastro, LGPD,
hub de primeiros passos), nada de refatoração de design, nada no
`publish.yml`. É o congelamento até 04/10.

## Método, e uma correção de método

Mesma leitura de código, testes e docs — mais **as telas renderizadas em
390 px**, site e painel, coisa que a primeira avaliação não fez. Uma lição
do processo: a primeira captura mostrou o site "vazando" para a direita no
celular, e era o Chrome headless recusando janela menor que 500 px. Medido
antes de escrito — e o mesmo cuidado vale para toda impressão daqui em
diante.

## A nota refeita

| Visão | Peso | 11/09 | **12/09** | O que moveu |
| --- | --- | --- | --- | --- |
| 1. Site de militância | 20% | 6,5 | **8,3** | OG 4→9 · robustez 5→9 · medição 1→6 |
| 2. Design | 10% | 7,0 | **7,2** | a11y 8→9 (contraste medido, `goldDim`); tokens e componentes continuam 5 e 4 |
| 3. Programação | 15% | 7,0 | **8,2** | concorrência 3→8 · CI 5→8 · docs 6→8 · contrato 7→8 |
| 4. Administração | 20% | 5,5 | **7,1** | permissão 3→9 · integridade 3→8 · auth 8→9 · backup 7→8; observabilidade segue 2 |
| 5. Ferramenta de edição | 10% | 7,0 | **7,6** | rascunho 6→8 · estúdio 7→8; aulas segue 4 |
| 6. Ferramenta de organização | 15% | 6,0 | **6,0** | nada — é o horizonte B |
| 7. Entrada | 10% | 6,0 | **8,0** | dev 6→9 · coordenação 5→8; militante segue 7 |
| **Geral** | | **6,4** | **7,6** | |

Prova de cada critério que subiu: `acoes/pessoas` (permissão),
`acoes/concorrencia` (integridade), `acoes/login` (auth), `acoes/backup`,
`contrato/og`, `acoes/sinal` + Leituras › Semana (medição), `contrato/docs`,
`verificar.yml`, `contrato/contraste`, `fumaca/estudio`, `comece-aqui.md`,
`/painel/ajuda`. Nada subiu sem teste.

O que a nota diz: o produto saiu de "bom onde foi pensado, ausente onde
ninguém precisou" para "protegido e medido, mas ainda sem a camada da
semana". As três notas que restam abaixo de 5 — **tokens de design 5,
componentização 4, aulas 4, semana/mês 3, rastro 3, observabilidade 2** —
são todas de B e C, e todas conhecidas.

---

## 1. Site de militância — o que ainda dói

**Forte agora:** cartão certo em toda rota, a chapa sempre na tela do número,
a inscrição atrás do `apiFetch`, e — pela primeira vez — número: quantos
abriram, quantos compartilharam, quantos chegaram ao passo 3.

**Visto na tela (390 px):**
- A home funciona no celular: kicker em duas linhas, faixa "Vote 14", os
  seis cartões, a história. Sem vazamento.
- ~~Os cartões da home são translúcidos e o cordel passa por cima~~ —
  **retirado em 12/09**: era artefato da captura (página dentro de iframe,
  com a animação de entrada congelada pelo tempo virtual). Renderizada
  direto, os cartões são opacos (`C.paper`) e o cordel fica atrás. Segunda
  lição de método no mesmo dia: impressão visual também se mede.
- `/candidatos` sem a lista (rede fora, ou lista não fechada) é a chapa e
  80% de tela vazia. A mensagem manda para `/propostas`; podia trazer a
  faixa da eleição e o botão "Quero ajudar" — o eleitor que abriu a página do
  número está a um toque de virar militante.

**Ainda por fazer:** medição só sobe de 6 para 8 com quatro semanas de dado
e a aba "Site" em Leituras (B). A semente vazia da programação é certa, mas
o `/programacao` sem publicação nenhuma agora abre sem nada — conferir o
estado vazio dele antes de 05/10.

## 2. Design — o que ainda dói

**Forte:** identidade intacta; o cartão OG finalmente na fonte do site;
contraste medido (14 pares) e um token corrigido.

**Dívida, medida de novo:** `2px solid` à mão **52**; `HATCH` copiado
**7** vezes; cores hexadecimais fora do tema **167** ocorrências no site;
Tailwind instalado e sem uso. Nada disso mudou — é o item 19, e não mexe
em voto. Mas o número serve de linha de base: em 11/12, os três têm de estar
perto de zero.

**Painel:** `painel.css` tem 76 KB e 1.542 linhas, servido em toda tela com
versão (cacheia — ok). O que a leitura nova achou: **154 `style="…"`
inline** nos PHP do painel e **11 `<form style="display:inline">`** — a
própria regra da casa ("ações em `.acoes-celula`, classe nova exige regra no
CSS") sendo contornada por atalho. Não quebra; é o mesmo custo dos `2px
solid` do site, do outro lado.

**No encontro aberto (390 px):** o Playbook — texto longo com a caixa
vermelha de "travas" — vem **antes** das peças e do preparo. Quem abriu para
trabalhar rola uma tela de leitura antes de chegar ao que faz. É a régua
"leitura não mora dentro de mesa" aplicada à própria tela do encontro:
Playbook cabe num `<details>` fechado, como "O que dá para fazer aqui".

## 3. Programação — o que ainda dói

**Forte:** `com_trava()`, sandbox com paralelismo real, `postarJson()`,
cabeçalhos e corpo do POST na resposta, dois workflows, versões pinadas,
docs presos por teste, `apiFetch` sem exceção.

**Ainda:**
- `layout.php` continua com ~320 linhas de JS inline: sem cache, e é o que
  impede uma CSP. Item 15; primeiro de B depois do CSV.
- `publish.yml` segue com `npm install` e sem lint — coberto pelo
  `verificar.yml`, mas são duas linhas que dependem de autorização.
- A suíte passou de 40 s para 63 s. Aceitável; se passar de 90, os testes de
  ação ganham `--test-concurrency` por arquivo.
- PHP 8.1 no CI ainda não rodou (o push desta manhã foi antes do workflow).
  O primeiro push vai dizer.
- `eventos-comum.php` (827) e `layout.php` (780) continuam os maiores
  arquivos de lógica. Não é urgente; é o teto de 800 do plano de 10/09 sendo
  tocado.

## 4. Administração — o que ainda dói

**Forte:** as duas falhas graves de 11/09 estão fechadas e presas por teste
(escalada por área; gravação concorrente). Tentativas por conta+endereço,
`X-Forwarded-For` só atrás de proxy, `Cache-Control` explícito, zerar com
backup antes.

**Ainda, em ordem:**
1. **Observabilidade 2** — sem log de erro, sem alerta de backup, sem
   uptime. É o único critério abaixo de 3 que sobrevive à eleição sem
   mudar, e é o que mais importa na noite de 04/10: se o painel cair, ninguém
   sabe. Item 35 é C; **vale puxar o mínimo para antes de 04/10**: um
   monitor externo gratuito e o `touch` do último backup na Manutenção. Uma
   hora.
2. Sem `Content-Security-Policy` / `frame-ancestors` — depende do item 15.
3. `$_SESSION['senha_nova']` em texto (2 ocorrências) — item 16.
4. `api/escala.php` sem teto por visitante (só o token HMAC) — pequeno;
   entra com o `registrar_envio('escala')` numa linha.
5. Sessão sem tempo de vida absoluto (só 2 h de inatividade).

## 5. Ferramenta de edição — o que ainda dói

**Forte:** rascunho em fatos e na ficha; a porta do Estúdio com teste;
`fazer_backup()` calado quando a pasta não existe.

**Ainda:** aula é código (4). ~~E os textos de "antes da campanha"
desatualizados~~ — **retirado em 12/09**: os textos são deliberadamente
neutros de fase, dizem "antes" e "durante" lado a lado, e a regra está
escrita em `aulas-conteudo.php` ("nunca a data de virada: texto datado
envelhece sozinho"). Leitura minha apressada; o código estava certo.

## 6. Ferramenta de organização — o que ainda dói

Nada mudou e a nota não mudou (6,0). É a visão inteira do horizonte B:
exportar, rastro, LGPD, metas, tarefas, importar, escala sem conta. O que a
segunda leitura acrescenta é **ordem**: CSV primeiro (é o pedido do dia 6),
rastro segundo (é o que LGPD e a linha do tempo precisam), LGPD terceiro.

## 7. Entrada — o que ainda dói

**Forte:** desenvolvedor novo tem trinta minutos escritos e um script;
coordenação nova tem `/painel/ajuda` e cada tela dizendo para que serve.

**Ainda:** o militante novo continua caindo no hub inteiro (item 23).
Visto na tela: o hub em 390 px está bem — fila, próximo encontro, formação,
três linhas de atividade e a barra de baixo. O que uma pessoa recém-aprovada
precisa é **menos** do que isso, não mais.

---

## Quatro olhares que a primeira avaliação não teve

### 8. O eleitor no celular

Nove telas renderizadas em 390 px: home, candidatos, quero ajudar,
programação, hub, inscrições, lista de encontros, encontro aberto,
Leituras. **Nenhuma vaza, nenhuma esconde ação.** O painel no polegar é
melhor do que a primeira avaliação supôs lendo CSS — a barra de baixo, as
abas em botão, os cartões no lugar das tabelas funcionam. O que sobra são
dois pontos: o Playbook antes do preparo (feito em 12/09: virou `<details>`
fechado) e os chips de "A operação hoje" no hub quebrando em três linhas.

### 9. O dia da eleição

Pergunta: **o que pode dar errado em 04/10 e ninguém saber?**

| Risco | Hoje | Mínimo antes de 04/10 |
| --- | --- | --- |
| O painel cai e ninguém vê | nada avisa | monitor externo gratuito em `/` e `/painel/api/sessao.php`, alerta para o WhatsApp da coordenação |
| O backup do cron parou há dias | nada avisa | Manutenção mostra a data do último zip em vermelho se > 36 h |
| A home pede voto no dia 05 | `faseEm()` sabe, a home não | o texto da fase `depois` (aposta 5) — decisão sua, ainda aberta |
| Munição libera arte no dia da votação | travada por `faseEm()` | conferir no dia 03 com o relógio do celular adiantado |
| 30 celulares no QR | `com_trava()` | validação em campo (item 10) antes |
| Alguém tranca a conta da coordenação | por conta+IP | feito |

Duas linhas da tabela cabem em uma hora e não são produto: o monitor e a
data do último backup. Recomendo puxá-las para esta semana.

### 10. O dado

`dados/` local tem 128 KB em PHP. A cada request, `usuario_atual()` relê e
normaliza `pessoas.php` inteiro; a cada gravação, o arquivo inteiro é
reescrito. Na casa das centenas isso é nada; na casa dos milhares começa a
pesar, e não há medidor. **Sugestão barata:** Leituras › Semana mostra o
tamanho de `pessoas.php` e o tempo de `ler_pessoas()` — é o item 33 (índice)
ganhando o número que decide quando ele entra.

Os `.lock` de `com_trava()` são arquivos vazios em `/dados`, cobertos pelo
`.htaccess`, e o backup os ignora (só `.php` e `.json`). Certo.

### 11. Quem mantém

Um autor, 146 commits, 30 deles hoje. O `comece-aqui.md` e o
`verificar.yml` reduzem o custo de um segundo par de mãos, mas o fato
continua: **se o único autor não puder publicar em 03/10, ninguém publica.**
Antes da eleição, a mitigação não é código: é alguém da coordenação com o
`comece-aqui.md` testado por ela mesma (cronometrar os trinta minutos) e
acesso ao repositório e ao hPanel. Item 36 é C; a pessoa com acesso é agora.

---

## O que deve melhorar — a ordem

**A régua mudou em 12/09.** "Nada antes de 04/10" valia para refatoração
de moldura; foi aplicada por engano ao que é camada nova com teste. A
régua certa: **entra agora tudo o que melhora a vida de alguém e chega com
teste; espera só o que reorganiza código sem mudar nada para o usuário.**
Com ela, no mesmo dia: primeiros passos no hub (militante), CSV
(coordenação), idade do backup na Manutenção e na fila do adm, teto na
escala, Playbook fechado (feitos, `c3a4481`…`b1d50e6`).

**O que fica desta lista:**
1. Monitor externo de uptime — não é código; é cadastrar o endereço.
2. Estado vazio de `/programacao` conferido.

**Sua parte, esta semana:** validação em campo (item 10); o texto do dia
05/10 (aposta 5); uma segunda pessoa com acesso e o `comece-aqui.md`
cronometrado.

**05/10 em diante, na ordem que mais sobe a nota:** CSV (13) → rastro (14)
→ LGPD (16) → `painel.js` + CSP (15) → primeiros passos no hub (23) →
tokens e componentes (19–20) → observabilidade completa (35) → aulas por
patch (26).

## Como saber que deu certo até 11/12

- A nota refeita com estes mesmos critérios dá **≥ 8,5**.
- Os seis critérios abaixo de 5 hoje (tokens, componentes, aulas,
  semana/mês, rastro, observabilidade) estão todos em 7 ou mais.
- `2px solid` à mão, `HATCH` copiado e `style=` inline no painel: perto de
  zero, com teste barrando o retorno.
- O post-mortem de 05/10 foi escrito com os números de "O site" em Leituras.
- Uma segunda pessoa publicou o site uma vez.
