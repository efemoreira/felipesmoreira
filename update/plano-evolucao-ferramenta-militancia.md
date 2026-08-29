# Plano de evolucao da ferramenta de organizacao da militancia

Data: 2026-08-29

## Tese do plano

Daqui para frente, a evolucao da ferramenta deve ser guiada por dois eixos e
uma frente estrutural de escala:

1. **estudo** — fazer mais gente aprender o suficiente para operar bem;
2. **crescimento** — fazer mais gente entrar, voltar e virar militancia ativa;
3. **arquitetura operacional** — fazer o trabalho certo aparecer no lugar certo,
   sem depender de adivinhar aba, de rolar demais ou de lembrar onde um bloco
   fica escondido.

O painel e o site publico ja sairam da fase de arrumacao basica. A pergunta nao
e mais “como organizar a ferramenta”, e sim “como usar a ferramenta para formar
mais gente e crescer melhor”.

Os dois primeiros eixos dizem para onde o movimento precisa andar. O terceiro
garante que a ferramenta continue legivel quando o uso real cresce. Nao e uma
frente paralela de capricho visual: e a condicao para estudo e crescimento
virarem rotina de trabalho, e nao conhecimento de quem decorou o painel.

## Objetivo

Transformar a ferramenta em um sistema que:

- converte curiosos em militantes ativos;
- reduz o tempo entre inscrição e primeira tarefa útil;
- transforma presença em encontro em entrada de base e não só em lista;
- acelera a formação por função;
- deixa explícitas no menu e na tela as rotinas que já viraram trabalho próprio;
- mostra com clareza o que faz crescer e o que só gera volume.

## Norte do produto

### Eixo 1 — estudo

O sistema precisa responder:

- quem entrou e ainda não começou a estudar;
- quem começou e travou;
- quem já pode assumir uma função;
- que aula ou checklist destrava o próximo passo de cada pessoa.

### Eixo 2 — crescimento

O sistema precisa responder:

- de onde as pessoas estão vindo;
- quais canais e militantes trazem gente que realmente milita;
- quais encontros geram inscrição, presença recorrente e nova função;
- em quais cidades o crescimento está virando base local de verdade.

## Ativos que ja existem

O produto ja tem infraestrutura forte para esta fase. O plano novo parte disso,
em vez de abrir frentes paralelas.

### Base pronta para estudo

- `/aulas` e `/painel/aulas` ja existem como sistema de formação.
- O currículo já está dividido em Pista Rápida e Pista Lenta.
- O convite do Dia 0 já existe.
- `checklists.php` já sustenta a ideia de “pronto para operar”.
- O catálogo de funções já existe em `funcoes.json`.
- O hub já mostra parte do próximo passo, via mesa da função e formação.

### Base pronta para crescimento

- `/queroajudar` já cria ou reaproveita a pessoa sem duplicar cadastro.
- `/presenca` já distingue confirmar de comparecer.
- O fluxo por origem (`?de=`) já existe.
- A aba “De onde vêm” já mede `chegaram` → `aprovadas` → `militaram`.
- O painel já consegue agrupar base por cidade e bairro.
- O funil D+0 / D+3 / D+7 de encontro já existe.

### Base pronta para operar isso sem quebrar

- As telas grandes do painel já foram divididas por responsabilidade.
- A navegação já mora em `layout.php`, e só lá — o que permite promover uma
  rotina para a lateral sem duplicar menu pelo painel.
- O painel já tem contrato de mobile para tabela virar cartão.
- Ações críticas já estão cobertas por `testes/acoes/`.
- Contratos PHP ↔ TS já estão cobertos por `testes/contrato/`.
- A suíte principal está verde.

## O problema agora

O sistema já coleta mais sinal do que transforma em direção.

Hoje ele já sabe muita coisa sobre:

- inscrição;
- origem;
- presença;
- formação;
- tarefa;
- função;
- encontro.

Mas ainda falta transformar isso em quatro movimentos de produto:

1. **estudar**;
2. **entrar em ação**;
3. **voltar**;
4. **trazer mais gente que presta**.

E falta uma segunda transformação, mais estrutural: parte do painel já cresceu
além do desenho que o ajudou a nascer.

Hoje há três sintomas claros:

- abas que começaram como atalho local já escondem rotinas inteiras;
- listas e formulários de ritmos diferentes ainda disputam a mesma tela;
- algumas áreas de estudo e acompanhamento já respondem perguntas diferentes,
  mas continuam penduradas no mesmo lugar.

Sem corrigir isso, a ferramenta até coleta mais sinal, mas custa mais energia
para ser usada como sistema de direção.

## Condicao de escala: a estrutura do painel precisa crescer junto

### Regra para decidir o que continua em aba

Daqui para frente, a régua deve ser simples:

- **fica em aba** o que ainda é recorte do mesmo objeto, na mesma sessão de
  trabalho;
- **sobe para o menu lateral** o que já responde uma pergunta própria, tem
  rotina recorrente e é aberto como destino, não como detalhe;
- **sai da mesma tela** o que acontece em ritmos diferentes, como fila para
  decidir e formulário longo para cadastrar;
- **nunca vira scroll gigante** o que pode ser resolvido melhor por aba ou por
  destino próprio na lateral.

Em outras palavras: aba e menu lateral são as duas soluções principais para
segurar legibilidade quando o uso cresce. O anti-padrão é empilhar blocos
grandes a ponto de transformar uma rotina inteira em rolagem longa.

### O que decide se pode empilhar: o peso do item, não o número de listas

Esta é a distinção que faltava, e sem ela a régua acima erra nos dois sentidos.

**Duas listas de links empilham bem.** Um item que é uma linha — nome, data, um
número de estado — e cuja função é *levar para outro lugar* não disputa a tela
com o que vem depois dele. Vinte linhas de link continuam sendo uma lista que se
varre com o olho; a rolagem é o índice, não o obstáculo. Foi o caso de
`/painel/eventos`: “Próximos” e “Já aconteceram” são o mesmo tipo de item, e
separá-los por aba obrigava a adivinhar de que lado estava o encontro procurado.

**Dois blocos de conteúdo não empilham.** Um item que se LÊ inteiro — uma ficha
aberta, um formulário de doze campos, um registro com motivo e histórico — ocupa
tela sozinho, e o que vem embaixo dele deixa de existir para quem chegou pela
primeira vez. Foi o caso de `/painel/fatos`: fila de decisão, ficha em branco e
arquivo eram três coisas que se leem inteiras, e empilhadas obrigavam quem veio
decidir a atravessar um formulário longo.

A pergunta prática, então, não é “são duas listas?”. É:

- **o item é um link ou é conteúdo?** Link empilha; conteúdo não.
- **o que vem embaixo cresce sem parar?** Se cresce, empilhar exige teto — a
  lista de baixo desenha as N mais recentes, a legenda conta todas, e a busca
  alcança o resto.
- **as duas coisas se leem na mesma sessão de trabalho?** Se sim, a rolagem é
  mais barata que a troca de aba, porque a aba esconde metade da resposta.

### Avaliacao inicial do que hoje esta dividido em abas

- **Encontros — próximos / já aconteceram:** **decidido: uma lista em cima da
  outra, na mesma tela.** Cada item é um link de uma linha — nome, família, data,
  local e preparo —, e não um bloco que se lê inteiro; duas listas dessas
  empilham sem uma esconder a outra. Trocar de aba, ao contrário, obrigava a
  adivinhar de que lado estava o encontro procurado. O preço de empilhar — a
  lista de baixo cresce para sempre — é pago por um teto de quinze na lista dos
  realizados, com o contador dizendo o total e a busca alcançando o resto.
- **Inscrições — fila / decididas / de onde vêm:** fila e decididas ainda podem
  seguir como recorte local da mesma área; “De onde vêm” já é leitura de
  coordenação e deve ser tratada como forte candidata a destino próprio.
- **Candidatos — candidatos / listas:** já são duas rotinas diferentes.
  Se continuarem na mesma área, precisam ser sustentadas por abas claras; se o
  uso confirmar cadência própria, uma das duas sobe para a lateral.
- **Pessoas — tipo de pessoa:** deve continuar em aba. Ali a aba é filtro
  permanente da mesma lista, e não uma área escondida.
- **Encontro aberto — preparo / pessoas / follow-up / dados:** ainda pode ficar
  local ao encontro enquanto seguir sendo navegação dentro do mesmo objeto.
  O ponto de atenção é o follow-up: se virar fila transversal entre encontros,
  deixa de ser aba e ganha lugar próprio.

### Mudancas essenciais ja identificadas

#### 1. Encontros: as duas listas na mesma tela, com teto — FEITO

`/painel/eventos` mostra “Próximos” e “Já aconteceram” uma em cima da outra. A
aba resolvia a rolagem e criava outro custo: quem procurava um encontro tinha de
adivinhar de que lado ele estava, e o contador da aba fechada era a única pista.

O que impede a rolagem gigante não é mais a aba, e sim o teto:

- a lista de baixo desenha os quinze mais recentes, e a legenda conta todos;
- a busca fica acima das duas e recorta as duas de uma vez — é por ela que se
  alcança o encontro antigo que não coube no teto;
- a de cima, que é o trabalho, vem primeiro e não depende do tamanho da de baixo.

Duas coisas foram corrigidas junto:

- **cancelado deixou de ser sinônimo de passado.** Encontro cancelado para daqui
  a duas semanas não aconteceu — ele não vai acontecer, o que é diferente, e a
  coordenação ainda precisa vê-lo para remarcar. Ele volta para a lista de cima,
  marcado como CANCELADO; o hub continua sem ele, porque lá a pergunta é "para
  onde eu vou".
- **o período recorta pelo relógio.** "Hoje" e "Esta semana" saem de `dia_de()` e
  `semana_de()`, as mesmas janelas que o site usa — o padrão continua sendo tudo,
  porque esta é a mesa de trabalho e abrir escondendo o mês que vem esconderia
  trabalho de quem veio preparar.

#### 2. Fatos: separar a lista operacional do formulario de novo fato

`/painel/fatos` hoje mistura três ritmos diferentes:

- zerar a fila;
- consultar o que já foi decidido;
- preencher uma ficha nova.

Isso precisa ser cortado. A tela principal de fatos deve ser, antes de tudo,
mesa de decisão. O cadastro de novo fato precisa ganhar fluxo próprio — por aba
própria, modal curto quando couber, ou destino lateral separado.

O objetivo é simples: quem abriu para decidir não deve disputar a mesma rolagem
com um formulário longo; quem veio cadastrar não precisa atravessar histórico e
fila para começar.

#### 3. Estudo: separar gestao de conteudo, acompanhamento e prontidao

A frente de estudo já não cabe numa única noção de “Aulas”. Hoje estão muito
misturados:

- gestão do conteúdo e do vídeo;
- link e porta de entrada do Dia 0;
- acompanhamento de quem estudou, travou e avançou;
- leitura de prontidão por função, que o plano já pede para nascer.

O próximo corte do estudo deve produzir ao menos três superfícies claras,
organizadas por abas bem definidas ou por novos destinos laterais, nunca por
uma página que empilha tudo:

- **conteúdo da formação** — editar vídeo, publicar, revisar o que está no ar;
- **acompanhamento de estudo** — ver quem começou, travou, concluiu e precisa de
  empurrão;
- **trilhas e prontidão** — ligar função, checklist, aula e primeira ferramenta.

Isso significa dar ao estudo sua própria arquitetura de operação: uma área que
pode abrir outras seções por abas ou pela lateral, mas não continuar como uma
única tela longa de edição.

#### 4. O menu lateral deve nomear as rotinas que ja viraram mesa propria

O painel já resolveu o problema difícil: a navegação mora em um só lugar. Agora
precisa usar essa vantagem.

As próximas promoções naturais para a lateral são:

- relatórios e leituras que já têm cadência própria, como “De onde vêm”;
- mesas que já deixaram de ser detalhe de outra área, como listas de candidatos;
- frentes do estudo que já exigem acompanhamento contínuo, e não só edição.

Não é para explodir o menu sem critério. É para escolher, caso a caso, entre
aba e lateral para evitar que trabalho recorrente continue preso em telas longas
demais.

## Plano por eixo

## 1. Estudo

### Meta

Reduzir o tempo entre “foi aprovado” e “já consegue operar uma função real”.

### O que construir

#### 1.1 Trilha mínima por função

Cada função precisa ter uma resposta objetiva para:

- qual é a primeira aula obrigatória;
- qual é a primeira checklist obrigatória;
- qual é a primeira ferramenta do painel que a pessoa precisa usar.

Saída esperada:

- o sistema deixa de formar genericamente e passa a formar para entrada em ação.

#### 1.2 Próximo passo individual de estudo

O painel já precisa mostrar, por pessoa:

- última aula feita;
- próxima rápida recomendada;
- se já pode operar;
- se ainda falta checklist, presença ou prática.

Saída esperada:

- a formação para de ser catálogo e vira percurso.

#### 1.3 Estado de prontidão

Além de “fez aula”, o sistema precisa distinguir:

- estudando;
- pronto para acompanhar;
- pronto para executar com supervisão;
- pronto para tocar sozinho.

Saída esperada:

- coordenação deixa de decidir isso só por memória ou impressão de grupo.

#### 1.4 Ponte estudo → ferramenta

Cada pessoa aprovada deveria chegar no painel com:

- convite do Dia 0;
- trilha inicial por função;
- link direto para a primeira ferramenta que faz sentido para ela.

Saída esperada:

- estudo e ferramenta deixam de competir; um passa a empurrar o outro.

### Métricas mínimas de estudo

- aprovadas que abriram o Dia 0;
- aprovadas que fizeram a primeira rápida;
- pessoas que concluíram a trilha mínima da função;
- tempo médio entre aprovação e primeira ação real no painel;
- pessoas que começaram a estudar e travaram por mais de 7 dias.

## 2. Crescimento

### Meta

Medir e aumentar a entrada de gente que não só se inscreve, mas milita.

### O que construir

#### 2.1 Relatório de origem em modo de decisão

A aba “De onde vêm” já mede bem o funil. O próximo passo é transformar isso em
ferramenta de decisão da coordenação.

Ela precisa responder:

- quem traz volume;
- quem traz conversão;
- quem traz presença recorrente;
- que tipo de origem vale repetir;
- que tipo de origem vale parar de empurrar.

Saída esperada:

- crescimento deixa de ser discussão abstrata e vira rotina de leitura semanal.

#### 2.2 Conversão por encontro

Além de origem, o sistema precisa medir encontro como máquina de crescimento:

- quantos confirmaram;
- quantos compareceram;
- quantos se inscreveram depois;
- quantos foram aprovados depois;
- quantos realmente militaram depois.

Saída esperada:

- encontro deixa de ser só evento e vira degrau do funil.

#### 2.3 Crescimento regional

O agrupamento por cidade e bairro já existe. O próximo passo é transformá-lo em
leitura de expansão:

- onde já há massa para núcleo;
- onde há só gente isolada;
- onde um encontro deveria ser presencial;
- onde um mutirão digital já não basta.

Saída esperada:

- crescimento deixa de ser só online e vira territorial.

#### 2.4 Reativação

O sistema já conhece gente que:

- se inscreveu e esfriou;
- confirmou e faltou;
- compareceu e sumiu;
- estudou e parou.

Precisa transformar isso em lista operacional de reativação.

Saída esperada:

- parte da base volta a crescer sem depender só de gente nova.

### Métricas mínimas de crescimento

- chegaram;
- aprovadas;
- militaram;
- militaram de novo;
- assumiram função;
- viraram recrutador de outra pessoa.

## 3. Estudo e crescimento juntos

### Meta

Parar de tratar crescimento e formação como áreas separadas.

### O que construir

#### 3.1 Da presença para a formação

Quem compareceu e ainda não é do movimento já recebe o convite de entrada. O
próximo passo é garantir o encadeamento inteiro:

- encontro;
- inscrição;
- aprovação;
- Dia 0;
- primeira função;
- primeira tarefa.

#### 3.2 Da formação para a contribuição

Fazer aula não pode terminar em “estudou”. Deve terminar em:

- abriu uma ferramenta;
- executou uma peça da função;
- entrou no ciclo de operação da área.

#### 3.3 Da contribuição para multiplicação

Quem já opera precisa ter meios de crescer a base:

- levar gente para encontro;
- compartilhar por origem atribuída;
- puxar mais gente para a função.

Saída esperada:

- o sistema passa a produzir militantes que também expandem o próprio sistema.

## 4. UX como motor de estudo e crescimento

### Meta

Tirar atrito das etapas que mais impactam entrada, ação e retorno.

### Prioridades de UX

#### 4.1 Painel mobile em uso real

A parte estrutural da auditoria mobile já avançou muito. O que falta agora é
validar uso real em aparelho:

- modais longos;
- filtros e busca;
- listas de trabalho em fluxo corrido;
- clareza de ação no polegar.

#### 4.2 Fluxo público de presença

O hero/banner e os cards novos de `/presenca` já existem, mas ainda precisam de
validação de uso:

- se melhoram contexto ou só empurram o formulário;
- se distinguem bem `confirmacao` e `chegada`;
- se continuam bons em conexão ruim e tela pequena.

#### 4.3 Segunda passada do front público

As maiores pendências públicas hoje continuam em:

- home;
- programação;
- aulas.

O foco aqui não é só aparência. É clareza de percurso:

- entrar;
- entender;
- estudar;
- agir.

## Ritmo de execução

## 0 a 30 dias

- revisar cada uso atual de abas com a régua “recorte local x rotina própria”; 
- ~~decidir em encontros o que continua em aba~~ — **feito**: as duas listas
  ficaram na mesma tela, com teto na dos realizados;
- ~~separar a mesa de fatos do fluxo de cadastrar fato novo~~ — **feito**: fila,
  trazer e decididos viraram três abas, e a tela abre na fila;
- fazer o primeiro corte da frente de estudo com seções claras de conteúdo,
  acompanhamento e prontidão, sem concentrar tudo numa única tela;
- transformar estudo e crescimento em métricas visíveis no painel;
- ~~definir trilha mínima por função~~ — **feito**: `trilhas.php` liga função a
  aula, checklist e primeira ferramenta, e o hub mostra a da pessoa;
- ~~fazer a agenda seguir a data atual~~ — **feito**: a semana corrente virou
  fonte única (PHP + TS), o período da capa se calcula sozinho quando o campo
  está vazio, e /programacao abre na semana com Hoje · Esta semana · Tudo;
- validar a presença redesenhada em aparelho real;
- fechar leitura operacional da aba de origem;
- mapear reativação básica por estado da pessoa.

## 30 a 60 dias

- subir para a lateral as primeiras rotinas que já saíram do tamanho de aba;
- dar ao estudo um lugar próprio de acompanhamento, separado da edição de vídeo;
- decidir se “Listas” de candidatos e “De onde vêm” já viram destinos próprios;
- painel de estudo por pessoa e por função;
- leitura de conversão por encontro;
- lista operacional de quem travou entre aprovação e primeira ação;
- leitura territorial por cidade e bairro.

## 60 a 90 dias

- consolidar a nova arquitetura operacional do painel com menu lateral mais
  fiel às mesas reais de trabalho;
- prontidão por função;
- ponte automatizada entre formação e primeira ferramenta;
- reativação por cohort;
- coordenação semanal baseada em estudo e crescimento, não só em fila do dia.

## O que nao deve liderar a proxima fase

Nao sao frentes descartadas. So deixaram de ser o eixo principal.

- refatoração estrutural sem ganho claro em estudo ou crescimento;
- promoção de aba para menu sem rotina real por trás dela;
- documentação além do necessário;
- melhoria visual sem impacto em entrada, leitura ou ação;
- métrica nova que não leve a decisão operacional.

## O que continua como suporte

- testes continuam obrigatórios para proteger o que já existe;
- contratos PHP ↔ TS continuam críticos;
- mobile-first continua disciplina de produto, sobretudo no painel;
- arquivos centrais grandes (`sessao.php`, `layout.php`, `agora.php`, `eventos-comum.php`) seguem pedindo cuidado, mas não precisam liderar o roadmap.

## Perguntas que o produto precisa conseguir responder ao fim desta fase

- quem entrou esta semana e ainda não começou a estudar?
- quem estudou, mas ainda não assumiu função?
- que encontro mais gera base ativa, e não só inscrição?
- que origem mais converte em gente que milita?
- em que cidade já existe massa suficiente para coordenação local?
- que função mais perde gente entre aprender e fazer?
- quem do time já virou multiplicador de gente nova?

## Regra de ouro

O crescimento certo não é o que enche formulário. É o que gera militância que
volta, aprende, faz e traz mais gente.

O estudo certo não é o que soma aula concluída. É o que coloca mais gente em
condição real de operar uma função.

E a arquitetura certa é a que deixa esse caminho visível, nomeado e usável no
painel, escolhendo bem entre aba e menu lateral, e nunca empurrando trabalho
recorrente para um scroll gigante.

O plano de evolução da ferramenta, daqui para frente, deve ser medido por essas
duas respostas.