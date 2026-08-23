# Plano de evolucao da ferramenta de organizacao da militancia

Data: 2026-08-23

## Objetivo deste documento

Este arquivo agora e um retrato do estado atual do projeto, com foco em quatro
perguntas:

1. o que ja foi feito;
2. o que foi bem feito e pode ser considerado fechado;
3. o que esta parcialmente resolvido;
4. o que ainda falta e deve vir antes de novas ideias.

Nao e mais um plano especulativo. E um quadro de progresso e prioridade.

## Base usada nesta atualizacao

Leitura do estado atual do codigo, com foco em:

- painel PHP;
- funil publico em Next;
- testes e scripts do projeto;
- tamanho e distribuicao atual das rotas e dos modulos extraidos.

Validacoes executadas nesta rodada:

- `npm test`;
- `npm run test:tipos`;
- `npm run lint`;
- diagnostico de erros do workspace.

Resultado: tudo passou.

## Resumo executivo

O projeto saiu de um painel com varias telas monoliticas para uma base bem mais
segura de evoluir. Hoje o ganho mais claro esta em tres frentes:

- as seis maiores telas operacionais do painel ja foram cortadas por responsabilidade;
- o hub ficou mais proximo de um cockpit operacional;
- a base de qualidade subiu com testes de contrato, fumaça, busca global e linha do tempo.

O que ainda falta nao e pouca coisa, mas agora esta muito mais claro:

- falta cobrir os fluxos de POST com testes de acao;
- falta cobrir a interacao real do funil publico com testes de navegador;
- falta terminar a limpeza do lado Next, onde ainda ha bastante estilo inline;
- falta transformar a infraestrutura de origem num relatorio operacional de conversao;
- falta cortar a ultima tela grande que ainda segue monolitica: `inscricoes.php`.

## O que esta feito

### 1. O painel operacao melhorou de verdade

Feito bem:

- O Inicio deixou de ser so um hub de navegacao e passou a juntar fila, panorama, atividade recente e formacao.
- A busca global do painel entrou como ferramenta real de coordenacao.
- A linha do tempo e a visao 360 da pessoa entraram sem criar um segundo arquivo de log.
- Filtros, abas, busca e vazios ficaram muito mais consistentes no painel.

Efeito pratico:

- menos ida e volta entre telas;
- melhor nocao do que esta vencendo hoje;
- melhor visibilidade do que o time fez e do que esta parado.

### 2. As seis telas grandes do painel foram cortadas

Este foi o maior ganho estrutural da rodada.

| Tela | Antes | Rota agora | Como ficou |
| --- | ---: | ---: | --- |
| `eventos.php` | 1371 | 60 | `eventos-acoes.php` · `eventos-lista.php` · `eventos-encontro.php` · `eventos-presenca.php` · `eventos-dados.php` |
| `pessoas.php` | 799 | 50 | `pessoas-acoes.php` · `pessoas-lista.php` · `pessoas-ficha.php` |
| `candidatos.php` | 910 | 48 | `candidatos-acoes.php` · `candidatos-tela.php` · `candidatos-form.php` |
| `fatos.php` | 830 | 43 | `fatos-acoes.php` · `fatos-fila.php` · `fatos-decididos.php` · `fatos-tela.php` · `fatos-form.php` |
| `agenda.php` | 684 | 27 | `agenda-acoes.php` · `agenda-tela.php` · `agenda-previa.js` |
| `producao.php` | 640 | 36 | `producao-acoes.php` · `producao-quadro.php` · `producao-card.php` · `producao-modal.php` · `producao-tela.php` |

Avaliacao:

- `eventos.php` continua sendo a melhor referencia de corte.
- `pessoas.php` e `candidatos.php` ficaram bem resolvidos e mais seguros de manter.
- `fatos.php` e `producao.php` seguiram o mesmo padrao corretamente.
- `agenda.php` teve um corte diferente, e correto: o problema maior ali era a concentracao de UI e JavaScript inline.

### 3. O funil publico avancou, mas nao terminou

Estado atual:

- `InscricaoClient.tsx`: 400 linhas.
- `Passos.tsx`: 207 linhas.
- `Campos.tsx`: 184 linhas.
- `Sucesso.tsx`: 176 linhas.

Leitura:

- A inscricao saiu de um monolito e entrou numa composicao boa por fluxo, etapas, campos e tela final.
- Esta bem encaminhada e pode ser marcada como refatoracao bem sucedida.

Estado atual da presenca:

- `PresencaClient.tsx`: 509 linhas.
- `Pecas.tsx`: 344 linhas.
- `Telas.tsx`: 96 linhas.

Leitura:

- Melhorou muito, mas ainda nao fechou no mesmo nivel da inscricao.
- O corte ja aconteceu, porem a orquestracao principal ainda esta grande demais para dizer que a frente acabou.

### 4. Reaproveitamento de infra e UX ja entrou no codigo

Feito bem:

- `barra_filtros()` agora esta espalhada nas telas certas do painel.
- `barra_busca()` cobre as telas que so procuram.
- O motor de rascunho local entrou em `layout.php` e ja esta plugado em agenda, encontro e candidato.
- O warning tipico dos testes Node foi silenciado no lugar certo, sem mexer no modelo do app.

Feito parcial:

- O autosave ainda nao foi expandido para toda tela longa que se beneficiaria dele.
- A busca global ainda pode levar melhor ao alvo exato em algumas areas.

### 5. A base de qualidade subiu bastante

Feito bem:

- Testes de contrato PHP x TS.
- Testes de fumaça das telas do painel.
- Testes especificos da busca global.
- Testes especificos da linha do tempo.
- Typecheck da raiz e dos testes.
- Lint limpo.

Validado agora:

- `npm test`: passou com 74 testes.
- `npm run test:tipos`: passou.
- `npm run lint`: passou.
- Workspace sem erros reportados.

## O que esta parcial e ainda pede segunda passada

### 1. Estados visuais e leitura operacional

Melhorou:

- fila;
- medidores;
- selos de atraso e urgencia;
- leitura geral do hub.

Ainda falta:

- espalhar o mesmo rigor visual para todas as areas operacionais remanescentes;
- reduzir texto demais em contextos de uso rapido no celular;
- reforcar o que e “agir agora” e o que e “contexto” em telas como Fatos e Produção.

### 2. Lado Next ainda esta visualmente mais fragmentado do que o painel

Hoje o painel ja opera mais como sistema. O front publico ainda nao.

Parcial bom:

- inscricao melhorou bastante;
- presenca melhorou bastante.

Ainda falta:

- home;
- programacao;
- aulas;
- presenca terminar de sair de tanto estilo inline.

### 3. Autosave entrou, mas nao fechou como frente concluida

Hoje existe em:

- agenda;
- encontro novo;
- dados do encontro;
- candidato.

Ainda falta decidir se vale expandir para:

- inscricoes do painel;
- fatos;
- producao;
- outras telas com formulario longo e risco real de perda.

## O que falta, por prioridade

### 1. Testes de acao do painel

Maior lacuna atual.

O que falta cobrir:

- aprovar inscricao;
- criar encontro;
- marcar checklist;
- tirar pessoa de encontro;
- publicar card;
- publicar e recolher candidato;
- acoes equivalentes das telas que acabaram de ser cortadas.

Por que vem primeiro:

- agora que o painel esta modularizado, o proximo risco nao e mais “nao consigo refatorar”; e “refatorei e quebrei o POST”.

### 2. Testes de navegador do funil publico

O que falta cobrir:

- troca de passo;
- foco depois da navegacao;
- persistencia em `sessionStorage`;
- comportamento em erro de rede;
- convite de ajuda apos presenca.

Por que vem primeiro:

- a maior parte dos testes atuais garante contrato e renderizacao;
- o funil publico ainda precisa de garantia de comportamento real.

### 3. `inscricoes.php`

Hoje e a ultima tela do painel que ainda segue o mesmo problema estrutural que as outras seis tinham antes do corte.

Estado atual:

- `inscricoes.php`: 528 linhas.

Leitura:

- e a proxima candidata natural ao mesmo corte por responsabilidade.
- como tela de fila e aprovacao, ela tambem merece a mesma seguranca que Eventos, Pessoas, Candidatos, Fatos e Produção ja ganharam.

### 4. Relatorio de conversao por origem

Esta e a maior frente de produto ainda pendente.

Ja existe:

- `?de=` na origem;
- gravacao no fluxo publico;
- estrutura para atribuicao.

Ainda falta:

- a tela operacional que responda quem recruta e o que converte.

### 5. Design system do lado Next

Ainda falta consolidar:

- menos estilo inline repetido;
- mais componentes visuais compartilhados;
- mais proximidade com a linguagem do painel.

### 6. P2 de experiencia de campanha

Ainda nao esta fechado:

- modo de campo para recepcao e contextos de uso em pe;
- “proximo passo” por pessoa, guiado por funcao, area e formacao.

## Arquivos grandes que continuam grandes, mas nao entram na mesma fila

| Arquivo | Linhas | Leitura correta |
| --- | ---: | --- |
| `sessao.php` | 1168 | E nucleo de sessao, permissao e modelo. Nao e o mesmo problema das telas monoliticas |
| `aulas-conteudo.php` | 1095 | E conteudo, nao tela operacional |
| `layout.php` | 975 | Cresceu com busca, rascunho e helpers compartilhados; e candidato a corte por peça, mas nao e urgencia de produto agora |
| `eventos-comum.php` | 856 | Dominio rico e coeso; aqui o problema e densidade, nao mistura de POST com HTML |
| `agora.php` | 718 | Fonte unica de fila e panorama; mesmo caso do anterior |

## Sequencia recomendada de trabalho

1. Escrever testes de acao do painel para as rotas ja cortadas.
2. Escrever testes de navegador para `/queroajudar` e `/presenca`.
3. Cortar `inscricoes.php` com o mesmo padrao das demais telas.
4. Consolidar o lado Next que ainda carrega muito estilo inline.
5. Abrir a frente de relatorio de conversao por origem.
6. So depois disso retomar ideias novas de produto que dependam dessa base.

## Regra de ouro para a proxima fase

Antes de inventar coisa nova, fechar o que ja esta parcialmente resolvido.

Hoje a base ja esta boa o bastante para a ferramenta crescer com mais seguranca.
O gargalo deixou de ser “como organizar” e passou a ser “como terminar o que ja
foi bem iniciado sem reabrir risco estrutural”.