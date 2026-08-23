# Plano de evolucao da ferramenta de organizacao da militancia

Data: 2026-08-23 (terceira rodada)

## Objetivo deste documento

Este arquivo e um retrato do estado atual do projeto, com foco em quatro
perguntas:

1. o que ja foi feito;
2. o que foi bem feito e pode ser considerado fechado;
3. o que esta parcialmente resolvido;
4. o que ainda falta e deve vir antes de novas ideias.

Nao e um plano especulativo. E um quadro de progresso e prioridade.

## O que mudou nesta rodada

A rodada anterior fechou a **garantia**. Esta fechou a frente que era a
prioridade 1 do proprio plano: **a auditoria mobile-first das telas de trabalho
do painel**. As treze tabelas do painel deixaram de depender de arrastar para o
lado.

| item da sequencia anterior | estado |
| --- | --- |
| 1. Auditoria mobile-first das telas de trabalho | **feito no painel** — as 13 tabelas viraram cartao no celular e a regra esta presa por teste |
| 2. Testes de navegador do funil publico | **parcial** — segue a decisao de nao entrar Playwright; foco e erro de rede no DOM continuam sem cobertura |
| 3. Segunda passada em home, programacao e aulas | ainda nao |
| 4. P2 de experiencia de campanha | ainda nao |

Validacoes executadas nesta rodada:

- `npm test` — **171 testes, 42 suites, tudo passando** (eram 167);
- `npm run test:tipos`, `npm run lint`, `npx eslint testes/` — limpos;
- `npm run build` — 17 rotas.

### A auditoria mobile do painel

**Um padrao so, e um HTML so.** `<div class="rolagem cartoes">` em volta de
toda tabela do painel: `.rolagem` segura o desktop, e `.cartoes` desmonta a
tabela abaixo de 700px — cada `<tr>` vira cartao, cada `<td>` vira bloco, e o
`data-rotulo` de cada celula entra no lugar do cabecalho que sumiu.

> **A alternativa era escrever duas arvores para a mesma lista.** Quem mantem
> duas mantem duas e conserta uma — e a que conserta e sempre a do desktop,
> porque e a que a coordenacao ve. A semantica de tabela continua inteira em
> tela larga.

Tres larguras de bloco resolvem o resto: cheia por padrao, `.meia` para o par
que so se le junto (confirmou × compareceu) e `.terco` para a trinca do funil
de origens. `.tarde` desce o que na linha era so mais uma coluna, e `.rodape`
separa por uma linha tracejada o que se FAZ do que se le.

| tela | o que mudou no celular |
| --- | --- |
| `eventos-presenca.php` | a pior tela do plano: cada pessoa e um cartao, os dois estados lado a lado em botao de largura inteira, o tipo num seletor proprio e o **Tirar** isolado no rodape |
| `pessoas-lista.php` | tipo e encontros sobem em par; login e funcoes descem — quem procura alguem pergunta "e apoiador?" e "ja apareceu?" antes de "qual e o login?" |
| `candidatos-tela.php` | numero e estado em par, as tres acoes no rodape do cartao |
| `municao.php` | fonte e estado em par, as tres acoes no rodape |
| `agenda-tela.php` | a programacao vira lista vertical |
| `inscricoes-origens.php` | os tres degraus em tercos, na mesma faixa: a leitura do relatorio e a QUEDA de um para o outro, e empilhados eles viram tres numeros soltos |
| `inscricoes-decididas.php`, `fatos-decididos.php` (3), `aulas.php`, `pessoas-ficha.php` | arquivo e relatorio: tabela no desktop, cartao no celular |
| `inscricoes-tela.php` | era a **unica sem `.rolagem`**: em tela estreita ela nao ganhava barra, ela empurrava a pagina para o lado |

**Dois defeitos de layout que so apareceriam no telefone foram fechados na
origem:** a foto do candidato e a coluna "Onde" da agenda sao opcionais, e o
`<td>` delas carregava uma quebra de linha solta. Vazio com espaco em branco
nao e `:empty` — os dois viravam um buraco de 12px no cartao. Os `if` agora
abrem e fecham colados nas bordas do `<td>`.

**A regra ficou presa por teste** (`testes/contrato/mobile.test.ts`, 4 testes):
toda tabela do painel dentro de `.rolagem.cartoes`, nenhuma `.rolagem` sozinha,
o bloco de CSS no lugar e nenhuma celula `.meia`/`.terco` sem rotulo.

> **Este teste existe para a proxima tabela.** As treze de hoje ja estao
> convertidas; o que se perde sem teste e a tabela numero catorze, escrita daqui
> a tres meses copiando a linha errada de uma tela antiga — e descoberta por
> alguem xingando o telefone numa noite de encontro.

Um efeito colateral, de proposito: `.acoes-celula` substituiu o
`style="display:inline"` que os `<form>` de acao carregavam dentro das celulas.
Os botoes de Municao passaram de `.btn` para `.btn-mini`, como em todas as
outras listas do painel.

## O que esta feito

### 1. Testes de acao: o POST deixou de ser o ponto cego

Era a maior lacuna do quadro anterior. Com as telas grandes ja cortadas, o risco
tinha deixado de ser "nao consigo refatorar" e passado a ser **"refatorei e
quebrei o POST"** — e o POST e onde moram as regras que nao tem desfazer.

`testes/acoes/` cobre seis telas operacionais **e** o relatorio de origem, e cada teste confere **as duas metades**: o que
ficou no arquivo em `/dados` e o que a pessoa le na tela seguinte.

| arquivo | as regras que ele prende |
| --- | --- |
| `inscricoes` | aprovar da conta a ficha que ja existe, e nao cria uma segunda; recusar nao apaga ninguem |
| `eventos` | `voltar()` leva a **aba** junto da ancora; encontro com gente na lista nao se apaga |
| `pessoas` | o ultimo administrador nao se rebaixa, nao se desativa e nao se apaga; juntar nao sobrescreve |
| `fatos` | quem traz o fato nao checa o fato — e o admin que destrava escreve o porque |
| `producao` | a regra do ledger **avisa e nao bloqueia**; card publicado e rastro |
| `candidatos` | o cargo confere os digitos; sem numero nao vai ao ar; a ordem da lista e a da colinha |
| `origens` | o relatorio ordena por quem militou, nao por barulho; e quem veio pela URL limpa fica fora da tabela |

**A acao sobe num `php -S`, e a tela continua no CLI.** Toda acao termina em
`header('Location: …')` + `exit`, e no SAPI de linha de comando o `header()` e um
nada: o teste nao teria como ver para onde a gravacao mandou. Nenhuma dependencia
nova — `php -S` ja vem na caixa, como o `node:test`.

**Dois defeitos reais apareceram na primeira execucao:**

- **nome so de espacos criava pessoa sem nome.** `normalizar_pessoa()` conferia
  `empty($p['nome'])` no campo cru — e `"   "` e string nao-vazia —, e so depois
  `limpar_texto()` a reduzia a `''`. Pelo mesmo portao passava candidato: numero
  de urna na colinha sem nome ao lado. Corrigido no portao unico;
- **o corte de `inscricoes.php` perdia o recado e a senha provisoria.** O bloco
  extraido continuava relendo a sessao que a rota ja tinha esvaziado. As 18 telas
  comparadas continuaram identicas byte a byte — o instantaneo e um GET com
  sessao vazia, e nao ve recado. Quem pegou foi o teste de acao.

### 2. O funil publico, sem navegador

**Decisao tomada nesta rodada:** nao entra Playwright. Ele baixa binarios de
navegador e bate de frente com duas regras escritas no repositorio — "sem
framework de teste" e "cada dependencia e uma que alguem vai ter de auditar antes
de um deploy de campanha".

O que foi coberto sem dependencia nenhuma, em `testes/contrato/inscricao.test.ts`:

- **a regua da tela contra a regua do servidor**, nas duas direcoes;
- **a passagem de bastao de `/presenca` para `/queroajudar`** — as duas listas
  lidas do codigo, e nao copiadas para o teste;
- **a mascara do telefone** contra o `so_digitos()` do PHP.

Para isso a regua do servidor precisou sair de dentro do endpoint: era uma
sequencia de `if` no meio de `api/inscricao.php`, e o que esta solto no meio de um
endpoint nao se chama de fora. Hoje e `recusa_de_inscricao()`.

> **A divergencia que doi tem direcao.** Se o servidor recusar algo que a tela deu
> como bom, a pessoa preenche os tres passos, ve marca verde em todo campo e leva
> um "nao deu" generico no fim — e vai embora. O contrario e de proposito.

**Fica de fora, e continua pendente:** o que so um navegador ve — foco depois da
troca de passo, e o comportamento em erro de rede dentro do DOM.

### 3. `inscricoes.php` foi cortada

Ultima tela monolitica. De **528 linhas para 52**, no mesmo desenho das outras
seis:

| arquivo | linhas | responsabilidade |
| --- | ---: | --- |
| `inscricoes.php` | 52 | so a rota |
| `inscricoes-acoes.php` | 153 | o POST inteiro |
| `inscricoes-tela.php` | 204 | cabecalho, panorama, abas e busca |
| `inscricoes-fila.php` | 172 | a aba de trabalho |
| `inscricoes-decididas.php` | 79 | a aba de arquivo |
| `inscricoes-origens.php` | 122 | a aba de conversao (nova) |

Provado com **18 telas de conteudo identico**, e cada modulo abre sozinho.

### 4. Os tokens que faltavam no lado Next

A moldura do cordel — o `3px solid` — estava escrita a mao em **87 lugares, em 20
arquivos**, com nove cores diferentes ao lado. O `3` e identidade, nao estilo: e
o que faz o site e o painel parecerem o mesmo produto, e o painel ja guardava o
dele num token do `:root`.

Hoje sai de `borda()` / `BORDA`, em `@/lib/theme`. O texto de leitura
(`fontSize: 15.5` com `lineHeight: 1.55`, em oito arquivos) virou `TEXTO.corpo`.

**As duas trocas sairam com markup byte a byte identico nas 17 rotas.**

> **A sombra dura virou token depois — e a decisao de desenho esta tomada.**
> Ela aparecia em 17 combinacoes de deslocamento e opacidade, o que nao era
> repeticao e sim deriva. A escolha: **uma opacidade so** (`C.sombra`), e a
> altura carregada pelo deslocamento, em **tres degraus** — `rente` 3,
> `cartao` 5, `alto` 8. Sai de `sombra()`, com `sombraErguida()` e
> `sombraAfundada()` para hover e clique. Ver a secao "A escala da sombra dura",
> mais abaixo.

### 5. O relatorio de conversao por origem

A infraestrutura de `?de=` existia desde sempre e ninguem conseguia responder a
pergunta que ela existe para responder. A aba **"De onde vem"** responde:

**Tres degraus, e nao dois** — `chegaram` → `aprovadas` → **`militaram`** (apareceu
em pelo menos um encontro). O terceiro e o unico que nao depende de a pessoa dizer
que vem.

> **A ordem e por quem militou, e o total so desempata.** Ordenar pelo total poria
> no topo justamente a origem que enche a fila e nao entrega.

Era um `<details>` recolhido no meio da fila, com duas colunas. Faltava o degrau
que decide.

## O que continua parcial

### Mobile first das telas

O painel esta fechado: as treze tabelas viram cartao no celular, a navegacao ja
descia para a barra do rodape, as abas sao links com URL propria, o quadro de
Producao ja empilha e os campos ja respeitam o minimo de 16px do Safari.

O que continua parcial mora **fora da tabela**:

- **modais longos** — leitura e acao com o viewport preso ainda nao foram
  medidos;
- **filtros e barras de busca** — o `.filtros-busca` ja cai para uma coluna aos
  600px, mas a quebra de botao ao lado de campo nao foi conferida tela a tela;
- **o site publico** — a rolagem horizontal global ja esta travada e os campos
  ja estao em 16px, mas home, programacao e aulas ainda nao passaram pela
  segunda passada (ver mais abaixo);
- **medir de verdade** — o que existe hoje e leitura de codigo e de regra CSS.
  Falta abrir as telas num aparelho e confirmar que nao sobrou rolagem lateral
  em nenhuma tela de uso cotidiano.

### Estado visual das areas operacionais

Melhorou no hub, na fila e nos medidores. Ainda falta espalhar o mesmo rigor para
Fatos e Producao, e reduzir texto em contexto de uso rapido no celular.

### O lado Next

A inscricao e a presenca ja estao bem divididas. Continuam pendentes de uma
segunda passada: **home, programacao e aulas**. Com `borda()`, `TEXTO` e agora
`sombra()` no lugar, a proxima passada tem onde se apoiar: a arrumacao de tokens
acabou, e o que sobra e a divisao das telas.

Na presença houve mais um passo já implementado: o fluxo de `/presenca` ganhou
hero com imagem real do encontro quando houver, textura de fallback quando não
houver e cards mais intencionais para os formulários de “vou” e “cheguei”.

Isso **não entra como fechado ainda**. Falta testar e avaliar:

- legibilidade com imagem muito clara, muito escura ou sem imagem;
- leitura dos dois modos (`confirmacao` vs `chegada`) com a nova capa;
- comportamento no celular, especialmente em conexões lentas e telas pequenas;
- se o banner melhora o contexto sem empurrar o formulário demais para baixo.

Leitura correta:

- a mudança de UX/UI da presença já existe no código;
- o status dela é **implementada, mas ainda pendente de validação visual e de uso**.

### Autosave

Existe em agenda, encontro novo, dados do encontro e candidato. Continua em aberto
se vale expandir para inscricoes, fatos e producao.

## O que falta, por prioridade

### 1. Fechar a auditoria mobile fora da tabela

O painel nao depende mais de arrastar para o lado. O que sobra da frente:

- abrir as telas **num aparelho de verdade** e confirmar que nao sobrou rolagem
  lateral em nenhuma tela de uso cotidiano — o que existe hoje e leitura de
  regra CSS, e regra CSS nao e medicao;
- revisar **modais longos**, para garantir leitura e acao sem viewport presa;
- revisar **filtros e barras de busca**, para evitar quebra ruim de botao ao
  lado de campo;
- conferir os agrupamentos de acao que ficaram fora de tabela — Fatos e
  Producao, onde o rigor de estado visual ainda nao foi espalhado.

Saida esperada:

- um painel que se usa inteiro no celular sem "puxar pro lado para descobrir" o
  resto da informacao. **A parte que dependia de tabela ja esta.**

### 2. Testes de navegador, se e quando

So se a decisao sobre a dependencia mudar. O que sobrou sem cobertura e o foco
depois da troca de passo e o erro de rede dentro do DOM.

### 3. Segunda passada em home, programacao e aulas

As tres telas publicas que ainda nao passaram pela divisao que a inscricao e a
presenca ja tiveram.

Antes disso, vale uma checagem curta da presença já redesenhada, para decidir se
o hero/banner entrou como melhoria real ou só como peso visual.

### 4. P2 de experiencia de campanha

- modo de campo para recepcao e contextos de uso em pe;
- "proximo passo" por pessoa, guiado por funcao, area e formacao.

## Arquivos grandes que continuam grandes, e por que

| Arquivo | Linhas | Leitura correta |
| --- | ---: | --- |
| `sessao.php` | 1184 | nucleo de sessao, permissao e modelo. Nao e o problema das telas monoliticas |
| `aulas-conteudo.php` | 1095 | e conteudo, nao tela operacional |
| `layout.php` | 975 | cresceu com busca, rascunho e helpers; candidato a corte por peca, sem urgencia |
| `eventos-comum.php` | 856 | dominio rico e coeso; densidade, nao mistura de POST com HTML |
| `agora.php` | 718 | fonte unica de fila e panorama; mesmo caso |

## Regra de ouro para a proxima fase

Antes de inventar coisa nova, fechar o que ja esta parcialmente resolvido.

O gargalo ja nao e "como organizar", nem "como terminar sem reabrir risco", nem
"a lista de trabalho nao cabe no telefone": os cortes sao provados por comparacao
de saida, as regras estao presas por teste de acao, e a tabela do painel agora
vira cartao por padrao — com teste que pega a proxima que nascer horizontal.

**O que sobra e o que nenhum teste toma no lugar de alguem**: abrir as telas num
aparelho e olhar. A auditoria mobile fechou a parte que se prova lendo codigo; a
que falta se prova com o telefone na mao.
