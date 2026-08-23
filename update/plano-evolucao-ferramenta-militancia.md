# Plano de evolucao da ferramenta de organizacao da militancia

Data: 2026-08-22

## Escopo desta avaliacao

- Revisao estrutural do painel PHP, do funil publico em Next.js e da documentacao de arquitetura.
- Arquivos-base lidos nesta rodada:
  - `public/painel/layout.php`
  - `public/painel/painel.css`
  - `public/painel/index.php`
  - `public/painel/agora.php`
  - `public/painel/eventos.php`
  - `public/painel/eventos-comum.php`
  - `public/painel/agenda.php`
  - `public/painel/inscricoes.php`
  - `public/painel/pessoas.php`
  - `public/painel/candidatos.php`
  - `public/painel/fatos.php`
  - `public/painel/producao.php`
  - `public/painel/aulas.php`
  - `public/painel/aulas-conteudo.php`
  - `public/painel/api/inscricao.php`
  - `public/painel/api/presenca.php`
  - `src/app/page.tsx`
  - `src/features/inscricao/InscricaoClient.tsx`
  - `src/features/presenca/PresencaClient.tsx`
  - `src/features/programacao/ProgramacaoClient.tsx`
  - `src/features/aulas/AulasClient.tsx`
- Esta rodada nao incluiu teste manual em navegador, entrevista com usuarios do time nem medicao real de bundle, latencia ou abandono por etapa. As hipoteses de UX abaixo precisam ser confirmadas em uso real.

## Leitura executiva

O projeto ja tem tres qualidades raras: produto com tese clara, regras de negocio bem defendidas e identidade visual propria. Ele nao parece um painel generico; parece uma ferramenta pensada para campanha de rua, coordenacao e base.

O que mais segura a proxima fase nao e falta de ideia. E concentracao demais de interface, fluxo e regra em poucos arquivos muito grandes, somada a um lado Next que depende de componentes cliente longos com muito estilo inline. Isso encarece manutencao, dificulta testes, aumenta carga cognitiva e atrasa evolucao da UX.

Se a meta e virar a melhor ferramenta de organizacao de militancia, o caminho recomendado e:

1. reduzir friccao nas tarefas diarias e no uso em celular;
2. quebrar os monolitos de tela e os contratos espelhados;
3. transformar o painel em cockpit operacional, nao so em conjunto de telas;
4. consolidar um design system reaproveitavel entre painel e funil publico.

## Evidencias objetivas

Arquivos com maior concentracao de responsabilidade nesta rodada:

| Arquivo | Linhas | Sinal |
| --- | ---: | --- |
| `public/painel/eventos.php` | 1371 | Tela critica, muita decisao e execucao no mesmo arquivo |
| `public/painel/sessao.php` | 1162 | Nucleo de auth, permissao e modelo concentrado |
| `src/features/inscricao/InscricaoClient.tsx` | 1179 | Fluxo publico essencial, componente cliente longo |
| `public/painel/painel.css` | 1011 | Design system forte, mas grande e centralizado demais |
| `public/painel/candidatos.php` | 910 | Cadastro + listas + publicacao num mesmo modulo |
| `src/features/presenca/PresencaClient.tsx` | 870 | Fluxo de campo critico e denso |
| `public/painel/fatos.php` | 829 | Ficha + fila + decisao no mesmo arquivo |
| `public/painel/pessoas.php` | 799 | Cadastro mestre muito carregado |
| `public/painel/eventos-comum.php` | 736 | Dominio rico e concentrado |
| `public/painel/layout.php` | 708 | Shell do painel com muita responsabilidade |

Observacao importante: arquivo grande nao e defeito por si so. Aqui ele vira problema porque os maiores arquivos coincidem com os fluxos mais usados e mais sensiveis do produto.

## O que ja esta forte e deve ser preservado

- Navegacao com opiniao propria: lateral fixa, barra inferior no celular e contadores ligados ao `agora.php`.
- Modelo de produto coerente: pessoas, presencas, encontros, fatos, producao e formacao se conectam bem.
- Regras de negocio bem explicitadas no codigo e na documentacao, o que reduz improviso de campanha.
- Separacao correta entre site publico estatico e backend PHP operacional.
- Reuso real em alguns pontos criticos: `barra_abas()`, `barra_busca()`, modais, `checklists.php`, `funcoes.json`, `municipios-ce.json`, `agora.php`.
- Preocupacao real com acessibilidade, foco, teclado, contraste e uso no celular.

## Principais gargalos de UX/UI e de ferramenta

### 1. Carga cognitiva alta nas telas de operacao

As telas centrais sao fortes em regra, mas densas para quem esta trabalhando em campo. O melhor exemplo e `public/painel/eventos.php`, que concentra criacao, planejamento, execucao, presenca, funil e dados. Em cenario de campanha, muita profundidade vertical e muita decisao na mesma tela cobram caro.

### 2. O painel ainda funciona mais como conjunto de paginas do que como cockpit

O `index.php` e o `agora.php` ja apontam para essa direcao, mas ainda falta uma camada de operacao transversal: SLAs, gargalos da semana, encontros em risco, inscricoes envelhecendo, fatos sem saida, formacao parada, responsaveis sobrecarregados.

### 3. Design system dividido entre painel forte e front publico fragmentado

No painel, o eixo visual esta consolidado em `public/painel/painel.css`. No Next, paginas como `src/app/page.tsx`, `src/features/programacao/ProgramacaoClient.tsx`, `src/features/presenca/PresencaClient.tsx` e `src/features/aulas/AulasClient.tsx` acumulam muito `style={{...}}`. O resultado e uma camada visual menos reaproveitavel e mais cara de evoluir.

### 4. Contratos espelhados sem guarda automatica suficiente

A arquitetura depende de concordancia entre PHP e TypeScript em varios pontos de negocio. Isso esta bem documentado, mas ainda exposto a divergencia futura. Quanto mais a ferramenta crescer, mais isso vira risco operacional.

### 5. Fluxos publicos bons, mas extensos demais em componentes cliente longos

`InscricaoClient` e `PresencaClient` sao bons exemplos de regra correta com custo alto de manutencao. O produto esta certo; a composicao da interface e do estado pode ficar melhor.

### 6. Falta camada de observabilidade de produto

Hoje o sistema registra e decide. O proximo salto e enxergar: de onde vieram os militantes que viram conta, onde a fila trava, quais encontros mais convertem, quais funcoes param no Dia 0, onde a campanha esta perdendo tempo.

## Principios para a proxima fase

- Mobile first de verdade para quem esta na rua, na recepcao e no grupo.
- Microtarefas antes de megatela: cada tela precisa deixar claro o proximo passo.
- Uma unica fonte de verdade por regra de negocio, com teste quando houver espelho PHP x TS.
- Mais sinais de estado e prioridade, menos leitura obrigatoria para agir.
- Refatorar por borda de fluxo, nao por arquivo arbitrario.
- Melhorar sem abandonar a tese visual do projeto e sem migrar a forca para Tailwind.

## Plano de atualizacoes

## 1. Melhoria

### P0 - Ganhos rapidos de UX e operacao

| Acao | Onde | Resultado esperado |
| --- | --- | --- |
| Transformar o Inicio em cockpit operacional com blocos de SLA, risco e fila do dia | `public/painel/index.php`, `public/painel/agora.php`, `public/painel/layout.php` | Coordenacao ve em 10 segundos o que esta vencendo hoje |
| Reduzir densidade da tela de encontros com resumo fixo, proximas acoes e navegacao mais direta entre Preparo, Pessoas e Dados | `public/painel/eventos.php`, `public/painel/painel.css` | Menos rolagem, menos perda de contexto, mais uso seguro no celular |
| Unificar o comportamento de busca, filtros, abas e vazios em todas as areas | `public/painel/layout.php` + telas que ainda montam filtro manualmente | Interface mais previsivel e menor custo mental para o time |
| Reforcar estados visuais de prioridade, atraso, pronto, bloqueado e publicado | `public/painel/painel.css`, `public/painel/agora.php`, `public/painel/producao.php`, `public/painel/fatos.php` | A leitura deixa de depender tanto de texto corrido |
| Enxugar textos de apoio nas entradas publicas, mantendo a tese mas melhorando escaneabilidade | `src/app/page.tsx`, `src/features/inscricao/InscricaoClient.tsx`, `src/features/presenca/PresencaClient.tsx` | Mais clareza para quem chega por link de WhatsApp |

### P1 - Melhoria de composicao de tela

| Acao | Onde | Resultado esperado |
| --- | --- | --- |
| Quebrar `eventos.php` em blocos renderizados por responsabilidade (`lista`, `cabecalho do encontro`, `pecas`, `presenca`, `funil`, `dados`) | `public/painel/eventos.php` | Manutencao mais segura e evolucao de UX sem medo de regressao |
| Quebrar `pessoas.php` em lista, ficha, conta e duplicatas | `public/painel/pessoas.php` | Tela menos intimidante e mais facil de evoluir |
| Separar `candidatos.php` entre cadastro de candidato, listas e publicacao | `public/painel/candidatos.php` | Melhor clareza entre “registrar numero” e “montar colinha” |
| Extrair secoes de `InscricaoClient` e `PresencaClient` para componentes menores por etapa | `src/features/inscricao/InscricaoClient.tsx`, `src/features/presenca/PresencaClient.tsx` | Menor risco de quebra em fluxos publicos criticos |

### P2 - Melhoria de experiencia de campanha

| Acao | Onde | Resultado esperado |
| --- | --- | --- |
| Criar modo de campo para recepcao e eventos com alvos maiores, menos ruido e acoes principais fixas | `public/painel/eventos.php`, `src/features/presenca/PresencaClient.tsx` | Uso mais rapido em pe, com uma mao |
| Criar “proximo passo” por pessoa no painel com base em funcao, area e estado da formacao | `public/painel/agora.php`, `public/painel/index.php`, `public/painel/aulas.php` | O painel deixa de ser so menu e vira orientador de trabalho |
| Exibir contexto operacional por encontro: lotacao esperada, confirmados, comparecidos, D+0, D+3, D+7 | `public/painel/eventos.php`, `public/painel/eventos-comum.php` | Melhor tomada de decisao sobre convocacao e seguimento |

## 2. Retirada de codigo

### Retirar concentracao e duplicacao que ja cobram juros

| Acao | Onde | Resultado esperado |
| --- | --- | --- |
| Remover blocos repetidos de estilo inline do lado Next, trocando por componentes visuais compartilhados e classes nomeadas | `src/app/page.tsx`, `src/features/aulas/AulasClient.tsx`, `src/features/programacao/ProgramacaoClient.tsx`, `src/features/presenca/PresencaClient.tsx` | Visual mais consistente e menos manutencao por copia |
| Remover montagem manual de filtros onde o helper compartilhado ja cobre a necessidade | telas do painel que ainda usam `.filtros` fora do padrao | Menos HTML repetido e menos divergencia de comportamento |
| Remover responsabilidades cruzadas de arquivos muito grandes, migrando para parciais ou helpers por fluxo | `public/painel/eventos.php`, `public/painel/pessoas.php`, `public/painel/candidatos.php`, `public/painel/fatos.php` | Menos risco de regressao por efeito colateral |
| Remover codigo de compatibilidade da importacao antiga da agenda quando nao houver mais orfas em producao | `public/painel/agenda.php` | Menos ramo legado e menos custo de leitura |
| Remover dependencia de “conhecimento oral” para contratos PHP x TS e trocar por testes de contrato | pontos espelhados entre `public/painel/*` e `src/lib/*` / `src/features/*` | Menos risco de divergencia silenciosa |

### Itens a nao retirar sem conversa previa

- Nao mexer no modelo estatico de hospedagem (`next.config.ts` com `output: "export"` e workflow de publicacao).
- Nao mexer em `conceito.html` sem alinhamento previo.
- Nao tentar migrar a identidade visual do projeto para Tailwind utilitario como estrategia principal.

## 3. Reaproveitamento

### Usar mais o que o projeto ja acertou

| Reaproveitar | Onde aplicar melhor | Ganho |
| --- | --- | --- |
| `agora.php` como fonte unica de pendencias | dashboard, alertas, ranking de gargalos, contadores do hub | Evita criar uma segunda logica de prioridade |
| `barra_abas()`, `barra_busca()`, `botao_modal()` | areas que ainda tem filtros ou modais montados na mao | Coerencia de UX e menos duplicacao |
| `checklists.php` + curriculo de aulas | ajuda contextual dentro de Fatos, Producao, Eventos e Munição | Formacao embutida no trabalho, nao separada dele |
| `funcoes.json` e a logica de mesas | personalizacao do painel e onboarding por papel | O sistema fala a lingua da funcao da pessoa |
| `validacao.ts` da inscricao | qualquer futuro formulario publico ou hibrido | Reuso de regra que ja esta madura |
| `cordelCanvas.ts` e os tokens de tema | previews, cards operacionais, geradores e pequenos paines visuais | Linguagem visual continua coerente sem redesenhar do zero |

## 4. Insercao

### Capacidades novas para sair de “painel bom” para “ferramenta de organizacao superior”

| Inserir | Onde | Valor de produto |
| --- | --- | --- |
| Timeline de atividade recente por area e por pessoa | painel e ficha da pessoa | Facilita coordenacao, cobranca e historico de acao |
| Painel de metricas operacionais com SLA | `index.php`, `agora.php` e possivel endpoint interno | Permite dirigir o dia por gargalo, nao por intuicao |
| Busca global de pessoa, encontro, fato, card e candidato | shell do painel | Reduz navegacao desnecessaria |
| Autosave local em formularios longos do painel | `eventos.php`, `pessoas.php`, `candidatos.php`, `agenda.php` | Menos perda de trabalho em celular, sessao expirada ou recarga acidental |
| Suite de testes de contrato PHP x TS | pasta de testes a criar | Protege regras espelhadas criticas |
| Smoke tests dos fluxos centrais | inscricao, presenca, aprovar acesso, criar encontro, publicar card | Seguranca para evoluir sem travar entrega |
| Visao 360 da pessoa | `public/painel/pessoas.php`, `public/painel/pessoas-comum.php` | Une inscricao, encontros, conta, funcao, candidatura e historico |
| Relatorio de conversao por origem | inscricoes, presenca, encontros, Munição | Ajuda a descobrir quem recruta e o que converte |

## Sequenciamento recomendado

### Fase 0 - 1 a 2 semanas

- Definir metricas de produto e de operacao.
- Escolher 3 perfis para validacao real: coordenacao, recepcao e militante novo.
- Abrir backlog curto de P0 com dono e criterio de pronto.

### Fase 1 - 2 a 4 semanas

- Cockpit do Inicio.
- Unificacao de filtros, estados visuais e vazios.
- Primeira reducao de densidade em Eventos e no funil publico.

### Fase 2 - 4 a 8 semanas

- Quebra dos monolitos de tela mais criticos.
- Extracao de componentes publicos compartilhados.
- Introducao de autosave nos formularios longos.

### Fase 3 - 8 a 12 semanas

- Timeline operacional.
- Busca global.
- Testes de contrato e smoke tests.
- Relatorios de conversao e painel de metricas.

## Metas de qualidade para aceitar a proxima fase

- Nenhuma tela critica do painel acima de 600 linhas sem justificativa forte.
- Nenhum componente cliente critico acima de 400 a 500 linhas sem extracao de subcomponentes.
- Toda regra espelhada entre PHP e TS protegida por teste de contrato ou por fonte unica de dados.
- Toda fila critica com estado visivel: normal, atencao, urgente, vencida.
- Toda tarefa frequente em celular concluida sem rolagem excessiva nem leitura de instrucoes longas.

## Backlog inicial sugerido

### Sprint 1

- Cockpit do Inicio com blocos operacionais.
- Padronizacao de busca/filtro/vazio em painel.
- Enxugamento visual da home e das telas publicas de entrada.

### Sprint 2

- Extracao estrutural de `eventos.php`.
- Extracao de subcomponentes de `InscricaoClient` e `PresencaClient`.
- Prototipo de autosave local em formulario longo.

### Sprint 3

- Timeline de atividade.
- Busca global.
- Primeiros testes de contrato PHP x TS.

## Atualizacao apos a rodada de 2026-08-23

Esta rodada ja materializou uma parte importante do plano original.

### O que entrou bem

- A tela de encontros deixou de ser um monolito unico e foi dividida por responsabilidade em rota, acoes e blocos de tela.
- O mesmo movimento aconteceu em Pessoas e Candidatos, reduzindo o risco de mexer em gravacao e quebrar HTML no mesmo arquivo.
- Entrou uma busca global do painel, coerente com a tese de operacao: procurar sem saber em que tela procurar.
- Entrou uma linha do tempo derivada dos carimbos reais do sistema, sem criar um segundo arquivo de log.
- O hub ficou mais perto de um cockpit operacional, com fila, panorama e atividade recente.
- O funil publico comecou a sair de componentes clientes monoliticos: inscricao e presenca ja ganharam extracoes de etapas e pecas visuais.
- O projeto agora tem uma suite de testes com valor de produto, nao so de compilacao: contrato entre PHP e TS, fumaça das telas, busca global e linha do tempo.

### O que esta validado nesta rodada

- `npm test`: passou com 74 testes.
- `npm run test:tipos`: passou.
- `get_errors`: sem erros reportados no workspace.

### O que ainda merece segunda passada

- Os testes atuais cobrem bem contrato e renderizacao, mas ainda nao exercitam os POSTs criticos do painel como fluxo completo.
- A refatoracao do lado Next melhorou a composicao, mas ainda ha bastante estilo inline fora do eixo compartilhado do painel.
- Alguns modulos extraidos continuam dependentes da ordem de includes da rota; esta costura esta correta, mas ainda pede disciplina para nao virar acoplamento acidental.
- A busca global ainda pode aprofundar o destino dos resultados em algumas areas, principalmente quando a melhor experiencia e cair no item exato, e nao so na tela.

## Expansao recomendada a partir do que ja foi entregue

### 1. Fechar a cobertura dos fluxos criticos do painel

- Acrescentar testes de acao para aprovar inscricao, criar encontro, marcar checklist, tirar pessoa de encontro, publicar card e publicar/recolher candidato.
- Objetivo: proteger o lado POST das telas que ja foram divididas.

### 2. Cobrir interacao real do funil publico

- Criar testes de navegador para `/queroajudar` e `/presenca` com foco em:
  - troca de passo;
  - foco apos navegacao;
  - persistencia em `sessionStorage`;
  - convite de ajuda apos presenca;
  - comportamento em erro de rede.
- Objetivo: garantir UX, nao so sintaxe e tipo.

### 3. Consolidar um design system do lado Next

- Migrar os trechos repetidos de estilo inline para componentes e tokens compartilhados, principalmente em home, aulas, programacao e presenca.
- Objetivo: o painel ja tem linguagem consolidada; o front publico precisa ganhar o mesmo grau de reaproveitamento.

### 4. Reduzir acoplamento entre rota e modulos extraidos

- Documentar, por tela grande, quais dependencias o arquivo de rota precisa carregar antes dos modulos.
- Quando fizer sentido, mover `require_once` implicito para dentro do modulo que depende dele.
- Objetivo: evitar que a proxima refatoracao quebre porque o arquivo certo deixou de ser includo antes.

### 5. Lapidar a busca global como ferramenta de coordenacao

- Levar resultado de Munição, Produção e Fatos para ancora ou estado mais especifico quando existir alvo preciso.
- Adicionar atalhos de volta para o recorte da area com a busca ja preenchida, em todas as secoes.
- Considerar busca por combinacoes frequentes de operacao: telefone + nome, numero de urna + partido, encontro + local.

### 6. Limpar o ruído da infraestrutura de testes

- Resolver o warning do Node sobre `testes/alias.ts` sem `type: module`, de preferencia de forma localizada em `testes/`, sem alterar o modelo inteiro do app.
- Objetivo: deixar CI e execucao local silenciosos, para warning real nao se perder no barulho.

## Regra de ouro para a execucao

Nao tentar “modernizar tudo” de uma vez. O acerto do projeto esta justamente em ter identidade, opiniao e regra de negocio. A evolucao mais valiosa aqui nao e trocar a tese do produto; e reduzir atrito, quebrar concentracoes arriscadas e fazer a ferramenta enxergar a operacao inteira.