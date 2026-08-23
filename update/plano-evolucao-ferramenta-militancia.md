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
| 2. Testes de navegador do funil publico | **feito sem navegador**, por decisao — ver abaixo |
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

`testes/acoes/` cobre seis telas, e cada teste confere **as duas metades**: o que
ficou no arquivo em `/dados` e o que a pessoa le na tela seguinte.

| arquivo | as regras que ele prende |
| --- | --- |
| `inscricoes` | aprovar da conta a ficha que ja existe, e nao cria uma segunda; recusar nao apaga ninguem |
| `eventos` | `voltar()` leva a **aba** junto da ancora; encontro com gente na lista nao se apaga |
| `pessoas` | o ultimo administrador nao se rebaixa, nao se desativa e nao se apaga; juntar nao sobrescreve |
| `fatos` | quem traz o fato nao checa o fato — e o admin que destrava escreve o porque |
| `producao` | a regra do ledger **avisa e nao bloqueia**; card publicado e rastro |
| `candidatos` | o cargo confere os digitos; sem numero nao vai ao ar; a ordem da lista e a da colinha |

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

### Estado visual das areas operacionais

Melhorou no hub, na fila e nos medidores. Ainda falta espalhar o mesmo rigor para
Fatos e Producao, e reduzir texto em contexto de uso rapido no celular.

### O lado Next

A inscricao e a presenca ja estao bem divididas. Continuam pendentes de uma
segunda passada: **home, programacao e aulas**. Com `borda()` e `TEXTO` no lugar,
a proxima passada tem onde se apoiar — o que falta agora e decisao de desenho
(a escala de sombra), e nao arrumacao.

### Autosave

Existe em agenda, encontro novo, dados do encontro e candidato. Continua em aberto
se vale expandir para inscricoes, fatos e producao.

## O que falta, por prioridade

### 1. A escala da sombra dura

Decisao de desenho, e a unica coisa que trava o token que falta em `theme.ts`.
Escolher uma opacidade por deslocamento e depois aplicar — com a mesma prova de
markup das outras duas trocas.

### 2. Testes de navegador, se e quando

So se a decisao sobre a dependencia mudar. O que sobrou sem cobertura e o foco
depois da troca de passo e o erro de rede dentro do DOM.

### 3. Segunda passada em home, programacao e aulas

As tres telas publicas que ainda nao passaram pela divisao que a inscricao e a
presenca ja tiveram.

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

O gargalo desta rodada deixou de ser "como organizar" e deixou de ser "como
terminar sem reabrir risco": os cortes agora sao provados por comparacao de saida
e as regras estao presas por teste de acao. **O que sobra e decisao de desenho** —
e essa e a unica coisa nesta lista que nenhum teste pode tomar no lugar de alguem.
