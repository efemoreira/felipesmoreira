# Plano de evolucao da ferramenta de organizacao da militancia

Data: 2026-08-23 (segunda rodada)

## Objetivo deste documento

Este arquivo e um retrato do estado atual do projeto, com foco em quatro
perguntas:

1. o que ja foi feito;
2. o que foi bem feito e pode ser considerado fechado;
3. o que esta parcialmente resolvido;
4. o que ainda falta e deve vir antes de novas ideias.

Nao e um plano especulativo. E um quadro de progresso e prioridade.

## O que mudou nesta rodada

A rodada anterior fechou a organizacao do painel. Esta fechou a **garantia**: o
que antes so estava bem arrumado agora esta preso por teste, e as duas frentes
que faltavam por inteiro sairam.

| item da sequencia anterior | estado |
| --- | --- |
| 1. Testes de acao do painel | **feito** |
| 2. Testes de navegador do funil publico | **parcial** — o que dava para prender sem navegador foi coberto; foco e erro de rede no DOM seguem pendentes |
| 3. Cortar `inscricoes.php` | **feito** |
| 4. Consolidar o estilo inline do lado Next | **parcial, e de proposito** — a moldura e o texto sairam; a sombra ficou, por ser decisao de desenho |
| 5. Relatorio de conversao por origem | **feito** |
| 6. Ideias novas de produto | ainda nao |

Validacoes executadas nesta rodada:

- `npm test` — **163 testes, 40 suites, tudo passando** (eram 74);
- `npm run test:tipos`, `npm run lint`, `npx eslint testes/` — limpos;
- `npm run build` — 17 rotas, e o markup comparado antes e depois.

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

> **A sombra dura NAO virou token, de proposito.** Ela aparece em 17 combinacoes
> de deslocamento e opacidade — isso nao e repeticao, e deriva. Escolher uma
> opacidade por deslocamento **muda o desenho** de varias pecas, e isso e decisao
> de quem olha, nao refatoracao.

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

A base existe e esta bem pensada:

- a navegação do painel ja desce para uma barra fixa no rodape no celular;
- as abas sao links com URL propria, e nao botões de JavaScript;
- o quadro de Produção ja empilha em vez de forçar rolagem lateral;
- o site publico ja trava a rolagem horizontal global com `html { overflow-x: clip; }`;
- os campos do site publico respeitam o minimo de 16px para o Safari nao dar zoom;
- o painel ja trabalha com alvo minimo de toque de 44px em varios controles.

O problema remanescente e que varias telas ainda dependem de tabela com
`.rolagem { overflow-x:auto; }`, o que no uso diario vira **scroll horizontal de
sobrevivencia** em vez de experiencia mobile-first.

Importante: os erros encontrados **tambem estao no painel**, e ali doem mais,
porque sao telas de trabalho cotidiano da coordenação e da militância. Nao e um
problema restrito ao site publico.

Hoje isso ainda aparece em pontos como:

- `agenda-tela.php`;
- `inscricoes-decididas.php`;
- `inscricoes-origens.php`;
- `inscricoes-tela.php`;
- `eventos-presenca.php`;
- `candidatos-tela.php`;
- `aulas.php`;
- `fatos-decididos.php`;
- `municao.php`;
- `pessoas-lista.php`;
- `pessoas-ficha.php`.

Leitura correta:

- a barra do celular, as abas e os grids principais estao no caminho certo;
- o painel ainda concentra varios dos piores casos, sobretudo onde a informacao
  foi mantida em tabela de escritorio e nao em lista de acao para celular;
- o que ainda falta e converter as **listas de trabalho** para leitura e acao com
  rolagem vertical apenas, sem depender de arrastar tabela para o lado;
- o problema ja nao e de navegação global, e sim de formatos de lista e tabela.

### Backlog mobile por tela, em ordem de gravidade

| prioridade | tela | gravidade | por que doi no celular | destino recomendado |
| --- | --- | --- | --- | --- |
| P0 | `eventos-presenca.php` | muito alta | lista operacional, varias colunas, varios botoes por linha, uso de porta/recepcao | virar lista vertical por pessoa, com ações empilhadas |
| P0 | `pessoas-lista.php` | muito alta | 6 colunas, selos, login, encontros e ações; tela de consulta recorrente | virar card-list com resumo + ações |
| P0 | `candidatos-tela.php` | alta | foto, número, estado e 3 ações por linha; fica apertado e ruidoso | virar lista de ficha curta por candidato |
| P0 | `municao.php` | alta | peça, fonte, estado e ações; uso recorrente em fluxo rápido | virar lista de peças com ações em bloco |
| P1 | `agenda-tela.php` | média-alta | tabela curta, mas com ação e metadados que pedem leitura rápida | virar lista vertical da programação no painel |
| P1 | `inscricoes-decididas.php` | média | arquivo/consulta, menos ação, mas ainda ruim para leitura apertada | pode manter tabela no desktop e virar cards no mobile |
| P1 | `inscricoes-origens.php` | média | relatório numérico com 6 colunas; leitura horizontal mata comparação rápida | manter semântica de tabela no desktop e versão empilhada no mobile |
| P1 | `fatos-decididos.php` | média | é arquivo, não operação de porta, mas continua largo e textual | manter semântica de tabela no desktop e versão condensada no mobile |
| P2 | `pessoas-ficha.php` | média-baixa | histórico de encontros; é consulta, não fila de ação | pode continuar tabela por exceção, com visual mobile próprio |
| P2 | `aulas.php` | baixa | relatório de progresso; uso mais analítico que operacional | pode continuar tabela por exceção |
| P2 | `inscricoes-tela.php` | baixa | o quadro “onde a militância mora” é analítico, mas ainda pode quebrar em tela estreita | pode continuar tabela por exceção |

### A pior tela hoje no celular

`eventos-presenca.php` é a pior experiência atual.

Motivo:

- ela junta frequência alta, urgência alta e densidade alta;
- é usada em contexto de recepção e evento, muitas vezes em pé e com pressa;
- cada linha pede leitura de identidade, estado, classificação e ação;
- a tabela atual mistura informação de pessoa com microações demais na mesma faixa horizontal.

Desenho vertical recomendado para ela:

- cada pessoa vira um card;
- o topo do card mostra nome, bairro/cidade, telefone e selo de origem;
- os estados `confirmou` e `compareceu` viram dois toggles ou botões grandes em linha ou pilha;
- a classificação (`tipo`) desce para um seletor próprio do card;
- a ação de tirar da lista vai para o rodapé do card, isolada como ação de risco;
- os totais do encontro continuam no topo da seção, em selos ou bloco-resumo;
- a busca e os filtros ficam acima da lista, sempre na vertical.

Saída esperada:

- uma lista de presença que se usa com o polegar, sem arrastar lateralmente para descobrir botão ou estado.

### Tabelas que DEVEM virar lista ou card no mobile

- `eventos-presenca.php`
- `pessoas-lista.php`
- `candidatos-tela.php`
- `municao.php`
- `agenda-tela.php`

Critério:

- telas de trabalho frequente;
- presença de ação por linha;
- coluna escondendo botão, estado ou identidade de pessoa;
- uso esperado em celular no fluxo do dia.

### Tabelas que podem continuar por exceção

Podem continuar como tabela no desktop, desde que ganhem uma apresentação
vertical no mobile e não dependam de rolagem horizontal para serem entendidas:

- `inscricoes-origens.php`
- `inscricoes-decididas.php`
- `fatos-decididos.php`
- `aulas.php`
- `pessoas-ficha.php`
- `inscricoes-tela.php`

Critério:

- telas mais analíticas ou de arquivo;
- leitura comparativa que ainda se beneficia de semântica tabular no desktop;
- pouca ou nenhuma ação por linha.

### Estado visual das areas operacionais

Melhorou no hub, na fila e nos medidores. Ainda falta espalhar o mesmo rigor para
Fatos e Producao, e reduzir texto em contexto de uso rapido no celular.

### O lado Next

A inscricao e a presenca ja estao bem divididas. Continuam pendentes de uma
segunda passada: **home, programacao e aulas**. Com `borda()` e `TEXTO` no lugar,
a proxima passada tem onde se apoiar — o que falta agora e decisao de desenho
(a escala de sombra), e nao arrumacao.

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

### 1. Auditoria mobile-first das telas de trabalho

Esta virou frente explicita do plano.

Objetivo:

- toda tela de uso diario funcionar no celular com **scroll vertical apenas**;
- tanto no site publico quanto no painel, com prioridade primeiro para o painel;
- tabelas virarem cards, blocos empilhados ou listas responsivas quando a largura
  nao couber;
- abas, menus, filtros e acoes principais continuarem acionaveis no polegar;
- nenhuma lista importante depender de arrastar horizontalmente para revelar
  campo critico ou botao de acao.

Checklist de estudo e correcao:

- mapear todas as ocorrencias de `.rolagem` e decidir se cada uma vira card-list,
  tabela condensada ou permanece tabela por excecao justificavel;
- mapear tambem as tabelas que nem chegam a passar por `.rolagem`, porque essas
  tendem a quebrar o layout de forma mais feia no celular;
- revisar listas com muitas colunas, principalmente Pessoas, Inscrições, Origens,
  Fatos decididos, Presenças de encontro e Munição;
- revisar agrupamentos de acoes para que empilhem sem quebrar contexto no celular;
- revisar modais longos, para garantir leitura e acao sem viewport presa;
- revisar filtros e barras de busca para evitar quebra ruim de botao e campo;
- medir se ainda existe rolagem horizontal real em telas que deveriam ser de uso
  cotidiano.

Saida esperada:

- um painel que se usa inteiro no celular sem “puxar pro lado para descobrir” o
  resto da informacao.

### 2. A escala da sombra dura

Decisao de desenho, e a unica coisa que trava o token que falta em `theme.ts`.
Escolher uma opacidade por deslocamento e depois aplicar — com a mesma prova de
markup das outras duas trocas.

### 3. Testes de navegador, se e quando

So se a decisao sobre a dependencia mudar. O que sobrou sem cobertura e o foco
depois da troca de passo e o erro de rede dentro do DOM.

### 4. Segunda passada em home, programacao e aulas

As tres telas publicas que ainda nao passaram pela divisao que a inscricao e a
presenca ja tiveram.

Antes disso, vale uma checagem curta da presença já redesenhada, para decidir se
o hero/banner entrou como melhoria real ou só como peso visual.

### 5. P2 de experiencia de campanha

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

O gargalo desta rodada deixou de ser "como organizar" e deixou de ser "como
terminar sem reabrir risco": os cortes agora sao provados por comparacao de saida
e as regras estao presas por teste de acao. **O que sobra e decisao de desenho** —
e experiencia de uso no celular — duas coisas que nenhum teste sozinho toma no
lugar de alguem.
