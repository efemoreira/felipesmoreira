# Plano de crescimento do painel — separar, nomear, fortalecer

Data: 2026-09-10

Continua `plano-evolucao-ferramenta-militancia.md` (29/08). Aquele diz **para
onde** o movimento anda — estudo e crescimento. Este diz **como o painel
aguenta** andar: o que sai de onde está, o que ganha nome no menu, o que
ainda falta e como o código por baixo para de ser cinco arquivos gigantes.

## O que aconteceu desde o plano anterior

Em doze dias o painel ganhou: follow-up com dono, reativação, trilhas por
função, semana de domingo a sábado, e — num único dia, 09/09 — escala de
peças, camada de liderança com sub-grupo e convite público, mutirão da semana,
redes profissionais e o Caixa. Cinco frentes novas, quase nenhuma com lugar
próprio: entraram no hub, numa aba, ou no fim de uma tela que já existia.

O resultado é o que o plano anterior chamou de "crescer além do desenho que o
ajudou a nascer", só que agora medido:

| Sintoma | Onde | Tamanho |
| --- | --- | --- |
| Hub com dez blocos empilhados | `index.php` | mesas · esperando você · operação hoje · próximos encontros · sua formação · o que andou acontecendo · quem te acompanha · sua gente · peça da semana · grupo |
| Mesa própria sem porta própria | hub | "Sua gente" (liderança) e "A peça desta semana" (mutirão) só existem no hub |
| Módulo fora do padrão | `municao.php` | 24 KB num arquivo só, com POST, tela e regra juntos; o Mutirão entrou aqui |
| Função copiada nove vezes | todo `-acoes.php` | `avisar()` e `voltar()` estão em `aulas`, `caixa`, `candidatos`, `eventos`, `inscricoes`, `fatos`, `municao`, `pessoas` e `producao` — nove cópias da mesma dupla |
| Leitura escondida em fila | `inscricoes-tela.php` | "De onde vêm" é relatório semanal da coordenação dentro da tela de aprovar gente |
| Leitura sem tela | `inscricoes-comum.php` | `militancia_por_regiao()` existe e nenhuma tela desenha |
| Bloco de conteúdo dentro de lista | `pessoas-lista.php` | a ficha abre **no meio** da lista (`bloco_ficha`), com duplicatas em cima |
| Arquivo que sabe tudo | `sessao.php` (1378 linhas) | sessão + auth + tema + AREAS/CAPACIDADES/CARGOS/REDES + modelo de pessoa + municípios + utilitários |
| Quatro domínios num `-comum` | `eventos-comum.php` (1583 linhas) | eventos + escala/convites + presenças/funil + regra de dado pessoal (`pode_ver_telefone`, `nome_encoberto`) |
| Moldura + biblioteca de componentes | `layout.php` (1184 linhas) | nav + `barra_abas` + `barra_busca` + modal + `menu_acoes` + `campo_cidade` + … |
| Área nova pede três edições à mão | `agora.php` | `tarefas_de()`, `estado_da_area()` e `panorama_de()` são cadeias de `if ($area === …)` |
| Grupo do menu contradiz a permissão | `layout.php` | Caixa e Pessoas são só-`adm` mas moram em "Coordenação" |

Nada disso está quebrado. É o custo de manutenção subindo a cada frente nova —
e o próximo mês vai trazer mais frente, não menos.

## A régua (a mesma de 29/08, com um acréscimo)

- **fica em aba** o que é recorte do mesmo objeto, na mesma sessão de trabalho;
- **sobe para o menu** o que responde pergunta própria, tem rotina recorrente e
  é aberto como destino;
- **sai da mesma tela** o que acontece em ritmos diferentes;
- **nunca vira scroll gigante** o que aba ou destino resolvem;
- **novo:** *leitura* e *mesa* são coisas diferentes. Mesa é onde se faz (fila,
  quadro, ficha). Leitura é onde se olha (funil, mapa, contagem por semana).
  Leitura não mora dentro de mesa: quem veio decidir não precisa do gráfico, e
  quem veio ler não precisa da fila.

## Mapa-alvo do menu

```text
Início
Formação                       (todo mundo)
Sua gente                      (quem `pode_liderar()`)            ← NOVO, tela pessoal

COMUNICAÇÃO
  Fatos do dia
  Produção
  Munição        abas: Mutirão da semana · Peças                  ← aba nova
  Estúdio

ENCONTROS
  Encontros      abas: Próximos · Já aconteceram · Follow-up
  Agenda

COORDENAÇÃO
  Inscrições     abas: Esperando · Já decididas                   ← "De onde vêm" sai
  Candidatos     abas: Candidatos · Listas
  Formação (editar)  abas: Conteúdo · Quem estudou · Trilhas
  Leituras       abas: Origem · Território · Encontros · Formação · Semana · Atividade  ← NOVO

ADMINISTRAÇÃO                                                     ← grupo novo
  Pessoas
  Caixa
```

Continuam fora do menu, por decisão já registrada no código: Conta (rodapé),
Manutenção (por URL, `exigir_admin()`), Procurar (busca da moldura).

O menu ganha **um** item de verdade (Leituras), **um** item pessoal (Sua gente,
só para quem lidera) e **um** grupo. O que ele perde é ambiguidade: todo item
só-`adm` fica sob "Administração", e a permissão vira legível no próprio menu.

## 1. Separar — o que sai de onde está

### 1.1 Hub: de dez blocos para cinco

O hub é a tela mais aberta do painel, no celular, em pé. Cada bloco a mais é
uma rolagem que ninguém faz.

| Bloco hoje | Destino |
| --- | --- |
| Mesas da função | **fica** — é a razão do hub |
| Esperando você | **fica** — é a fila |
| A operação hoje | vira **uma linha** com link para Leituras › Semana |
| Próximos encontros | **fica**, compacto: o próximo e "ver todos" |
| Sua formação | **fica**, só o próximo passo; o resto é `/aulas` |
| O que andou acontecendo | sai para **Leituras › Atividade**; o hub mostra três linhas e "ver tudo" |
| Quem te acompanha | vira **uma linha** no cabeçalho do hub ("Sua líder: Fulana · WhatsApp") |
| Sua gente | sai para **`/painel/gente`**; o hub mostra o cartão-contador |
| A peça desta semana | **fica** para quem está escalado — é chamada para ação; some para quem não está |
| Grupo de trabalho | **fica** só até `entrouNoGrupo`; depois some |

Regra que nasce daqui: **bloco do hub tem no máximo três linhas e um link.** O
que precisa de mais que isso tem tela própria. `testes/fumaca/painel.test.ts`
ganha um teste que conta os blocos e trava em cinco.

### 1.2 Munição: catálogo de peças ≠ mutirão da semana

São dois ritmos: as peças se editam raramente (é o catálogo do `/municao`
público); o mutirão é rotina semanal (escolher a peça, escalar, cobrar quem não
postou). Hoje os dois disputam a mesma página, e "marquei que postei" existe duas
vezes com nomes diferentes: `postei-a-peca` em `index.php` e `mutirao-postou`
em `municao.php`, gravando a mesma coisa.

- `/painel/municao?aba=mutirao` — a semana: peça escolhida, escalados, quem
  postou, histórico das semanas anteriores (o `mutirao.php` já é chaveado por
  semana; a leitura "quantos postaram por semana" é de graça).
- `/painel/municao?aba=pecas` — o catálogo.
- A tela abre no Mutirão para quem coordena e nas Peças para quem só edita.
- Quebrar em `municao.php` · `municao-acoes.php` · `municao-tela.php` ·
  `municao-mutirao.php` · `municao-pecas.php`, com `kit-comum.php` como está
  (compatibilidade com `api/kit.php`). `municao-acoes.php` inclui
  `acoes-comum.php` como os outros (item 3.1).
- Uma ação só, `mutirao-postou`, em `municao-acoes.php`; o hub envia para lá.

Se em trinta dias o mutirão virar destino de todo dia, ele sobe para a lateral.
Começa como aba porque é a mudança barata que já separa os ritmos.

### 1.3 Inscrições: "De onde vêm" sai da fila

A aba de origem é leitura da coordenação, semanal, comparativa. Vive numa tela
cuja pergunta é "quem aprovo agora?". Sai para **Leituras › Origem** (item 2.1).
Inscrições fica com duas abas: Esperando decisão · Já decididas.

`placar_de_origens()`, `funil_de_origens()` e `militancia_por_regiao()` saem de
`inscricoes-comum.php` para `leituras-comum.php`. O `inscricoes-comum.php` fica
com o que é inscrição: catálogo de funções, aprovação, mensagens, limite.

### 1.4 Pessoas: a ficha deixa de abrir dentro da lista

`pessoas-lista.php` hoje faz: abas por tipo · reativar · bloco de duplicatas ·
ficha aberta inline · a lista. A ficha é o caso clássico da régua — bloco de
conteúdo (encontros, acesso, candidatura, histórico, líder, redes) empurrando
uma lista para baixo.

- **`pessoas?p=<id>` continua sendo a URL** — é o que `procurar`, a linha do
  tempo e os links do painel já usam, e as regras de URL limpa são planas. O
  que muda é o que ela desenha: a ficha sozinha, com abas Ficha · Encontros ·
  Acesso · Histórico e "voltar à lista", em vez de `bloco_ficha()` no meio de
  `pessoas-lista.php`. A lista continua sendo só lista.
- **Duplicatas** vira aba da lista ("Possíveis duplicatas · N"), não bloco em
  cima de tudo. Some quando N = 0.
- **A reativar** continua aba — a decisão de 30/08 está certa. O filtro por
  rede (`?rede=`) já existe e fica onde está.

### 1.5 Administração como grupo

Pessoas e Caixa são as duas áreas que só `adm` abre, pela mesma razão (dado
pessoal e dinheiro seguem responsabilidade, não trabalho do dia). Ficam num
grupo "Administração" em `GRUPOS_NAV`. Grupo vazio não desenha — para quem não
é `adm`, nada muda.

Manutenção continua fora do menu, como o comentário do arquivo argumenta. O
que muda é que a Conta ganha, para `adm`, uma seção "Administração" com os
links (Manutenção · Backup — item 3.3) em vez de um `fieldset` avulso.

### 1.6 Encontro aberto: nada muda

Preparo · Pessoas · Follow-up · Dados já obedecem à régua. A escala mora no
Preparo porque é preparo. Não mexer.

## 2. Adicionar — o que ainda não tem lugar

### 2.1 Leituras (`/painel/leituras`)

A área que faltava. Só derivada — **não cria arquivo de dado**, lê o que já
está gravado. Capacidade `coordenacao` (e `adm`). Seis abas:

| Aba | Responde | De onde vem |
| --- | --- | --- |
| **Origem** | quem traz volume, quem traz gente que milita, o que repetir | `funil_de_origens()` — hoje é a aba "De onde vêm" |
| **Território** | onde já há massa para núcleo, onde é gente isolada | `militancia_por_regiao()` — existe e nenhuma tela usa |
| **Encontros** | por encontro: confirmaram → vieram → se inscreveram → aprovadas → militaram | `presencas` × `pessoas.status` × `encontros_da_pessoa()` — derivação nova |
| **Formação** | por função: quantos na trilha, quantos travados > 7 dias, quantos prontos | `aulas-progresso` × `trilhas.php` × `checklists.php` |
| **Semana** | o panorama de `panorama_de()` + "quantos postaram" do mutirão + saldo do Caixa (só adm) | `agora.php` (hoje "A operação hoje" do hub) |
| **Atividade** | o que andou acontecendo, com filtro por área e por pessoa, teto de 50 e busca | `linha_do_tempo()` de `atividade-comum.php` (hoje só o hub desenha, sem "ver mais") |

Padrão de cada aba: um `resumo-numeros` no alto, uma lista abaixo, um período
(`semana_de()`/`dia_de()` — as mesmas janelas do site). Sem gráfico até haver
pergunta que só gráfico responde.

É o que o plano anterior pedia como "estudo e crescimento em métricas visíveis"
e "coordenação semanal baseada em estudo e crescimento" — agora com endereço.

### 2.2 Sua gente (`/painel/gente`)

A capacidade `lideranca` tem `areas => []` e um bloco no hub. Com sub-grupo e
convite público já existindo, virou mesa: quem lidera abre isto toda semana
para ver quem sumiu, quem não começou a estudar, quem não confirmou o encontro.

- **Tela pessoal, não área.** `gente.php` nasce como `conta.php`:
  `exigir_login()` + `pode_liderar($u)` (`pessoas-comum.php`, que já abrange
  `lideranca`, `coordenacao` e `adm`) e lê por `minha_gente($eu)`, que por
  desenho não aceita parâmetro que amplie o recorte. Não entra em `AREAS` nem
  em `CAPACIDADES`: o comentário de `lideranca` ("não abre tela nenhuma — a
  diferença é o recorte") continua verdadeiro, e o teste de contrato que exige
  toda área num grupo não é tocado.
- Item **solto** em `menu_do_painel()`, ao lado de Formação, só para quem
  `pode_liderar()` — é pessoal, não é de grupo.
- Lista das pessoas sob a líder: nome, WhatsApp, último acesso, próxima aula,
  próximo encontro confirmado ou não. Recorte: Todas · Esfriando · Sem estudar.
- Convite do sub-grupo com o link e o texto pronto.
- O hub fica com o cartão-contador ("Sua gente · 7 · 2 esfriando").

### 2.3 Linha do tempo: aba de Leituras, não rota

`linha_do_tempo()` já existe, derivada dos carimbos, e pela régua deste plano
ela é leitura — vai para **Leituras › Atividade** (item 2.1), não para uma rota
própria. O hub mostra três linhas e "ver tudo" apontando para
`leituras?aba=atividade`; a linha do tempo de uma pessoa continua na ficha
dela. Continua sem arquivo de log: a regra de 29/08 permanece.

### 2.4 Mutirão com histórico

Item 1.2 — a aba já nasce com "semanas anteriores", que é a primeira leitura de
quem está ativo de verdade na comunicação.

### 2.5 O que **não** adicionar agora

- Ajustes por tela (link do grupo, WhatsApp da coordenação, temas do kit): as
  constantes em PHP mudam uma vez por semestre; tela de configuração é porta
  aberta para ninguém. Reavaliar aos 90 dias.
- Notificação/push: o painel é lido no polegar; o selo do menu é a notificação.
- Gráfico em Leituras: só quando uma pergunta não couber em número + lista.

## 3. Fortalecer — o que faz o painel aguentar a próxima leva

### 3.1 Quebrar os cinco arquivos centrais

Nenhum `require_once` existente muda: o arquivo antigo passa a incluir os
novos, e as telas continuam chamando o que chamavam. É reorganização, não
reescrita — e vai um arquivo por vez, com a suíte verde entre cada um.

| Hoje | Vira | Por quê |
| --- | --- | --- |
| `sessao.php` | `sessao.php` (sessão, login, token, tema, `exigir_*`) · `dominio.php` (AREAS, CAPACIDADES, TIPOS_PESSOA, REDES, CARGOS, STATUS_PESSOA, DESTINO_AREA, GRUPO_TRABALHO) · `pessoas-modelo.php` (`normalizar_pessoa`, `ler/gravar_pessoas`, `achar_*`, `*_por_telefone`) · `util.php` (`h`, `gravar_atomico`, `limpar_texto`, `sem_acento`, `telefone_bonito`, WhatsApp, municípios) | Quem edita um cargo não deveria abrir o arquivo da sessão. E `testes/contrato/*.ts` leem `sessao.php` por string — passam a ler `dominio.php`, que é menor e estável |
| `eventos-comum.php` | `eventos-comum.php` (evento, estado, tempo, agenda pública) · `escala-comum.php` (PECAS, convites, tokens, mensagens, `escala_sugerida`, VIVEIRO) · `presencas-comum.php` (presença, funil, follow-up, ROTULO_FUNIL) · `privacidade.php` (`pode_ver_telefone`, `nome_encoberto`, `telefone_encoberto`) | A regra de dado pessoal é do movimento, não do encontro — `pessoas`, `procurar` e a linha do tempo a usam. Morar em `eventos-comum` é o que fez `pode_ver_telefone()` perguntar `pode('agenda')` |
| `layout.php` | `layout.php` (moldura, nav, barra do celular, `cabecalho_pagina`) · `componentes.php` (`barra_abas`, `barra_busca`, `barra_filtros`, modal, `menu_acoes`, `recado`, `campo_cidade`, `links_whatsapp`) | Navegação mora em `layout.php` e só lá — continua verdade; os componentes é que não são navegação |
| `index.php` | `index.php` (roteia) · `index-acoes.php` (login, criar admin, `entrei-no-grupo`) · `index-login.php` · `index-hub.php` | O mesmo padrão das telas grandes; hoje é a única rota com POST inline além de `municao.php` |
| todo `-acoes.php` | `acoes-comum.php` com `avisar()` e `voltar(string $para, string $ancora = '')`; cada `-acoes.php` passa a incluí-lo (`eventos-acoes.php`, que tem `voltar($eventoId, $ancora)`, vira wrapper de duas linhas) | Nove cópias da mesma dupla; a próxima tela grande copiaria a décima |
| `inscricoes-comum.php` | tira `limite-comum.php` (teto, `chave_visitante`, `passou_do_limite`, `registrar_envio` — o guarda dos endpoints públicos de inscrição e presença) e `leituras-comum.php` (item 1.3) | `api/presenca.php` inclui um arquivo de inscrição só para pegar o limite |

### 3.2 `agora.php` deixa de ser cadeia de `if`

Hoje uma área nova exige tocar `tarefas_de()`, `estado_da_area()` e
`panorama_de()` — e esquecer um deles é silencioso (o selo fica mudo; foi o
commit de 10/09). Cada `-comum.php` passa a declarar as suas:

```php
// caixa-comum.php
function pendencias_caixa(array $u): array { … }   // itens da fila do hub
function estado_caixa(array $u): string  { … }     // a linha da mesa
function medidores_caixa(array $u): array { … }    // o que entra em Leituras › Semana
```

`agora.php` só percorre `areas_do_usuario()` e chama o que existir
(`function_exists`). O teste de contrato `painel.test.ts` ganha a regra: toda
área em `AREAS` tem `<area>-comum.php` com pelo menos `pendencias_<area>()`.

### 3.3 Backup dos dados

`public_html/dados/` fica fora do repositório e o único backup que existe é o
da agenda (`MAX_BACKUPS = 12`). Pessoas, presenças, fatos, caixa — nenhum.

- `manutencao.php` ganha um segundo bloco: **Backup** — gera `dados-AAAA-MM-DD.zip`
  em `PASTA_BACKUP`, guarda os últimos 14, e oferece download para `adm`.
- Um cron da hospedagem roda `php public_html/painel/backup.php` uma vez por
  dia. O script recusa qualquer coisa que não seja `PHP_SAPI === 'cli'` — não
  existe URL para ele. O botão da Manutenção chama a mesma função por
  `require_once`. Sem cron, o botão manual já é melhor que nada.
- Listado em "O que existe hoje" da Manutenção, com data do último.

É a mudança mais barata deste plano e a que mais protege. Vai primeiro.

### 3.4 Testes que prendem o plano

| Regra | Teste |
| --- | --- |
| Hub tem no máximo cinco blocos | `fumaca/painel.test.ts` conta `h2.secao` + `section.cartao-grupo` |
| Toda área tem `pendencias_<area>()` | `contrato/painel.test.ts` |
| Área só-`adm` mora em "Administração" | `contrato/painel.test.ts` cruza `CAPACIDADES` × `GRUPOS_NAV` |
| Leituras não grava nada | `acoes/leituras.test.ts`: GET não altera nenhum `ARQ_*` |
| `/painel/gente` só mostra gente da líder | `fumaca/acessos.test.ts`: troca a conta e procura nome alheio no HTML |
| Ficha de pessoa não aparece no HTML da lista | `fumaca/pessoas.test.ts` |
| `api/presenca.php` não inclui `inscricoes-comum.php` | `contrato/arquivo.test.ts` |

### 3.5 Documentação que acompanha

- `docs/painel.md` — tabela de arquivos centrais ganha os novos; a lista de
  URLs ganha `/painel/leituras` e `/painel/gente`.
- `docs/painel-ui-e-permissoes.md` — "Área nova exige" ganha o sexto lugar:
  `pendencias_<area>()`.
- `CLAUDE.md` — só a linha do padrão de tela ganha "e `<area>-comum.php` declara
  `pendencias_<area>()`". Nada mais; o detalhe fica nos docs.

## Ritmo

### 0 a 30 dias — proteger e separar o que dói

1. ~~**Backup** (3.3)~~ — **feito em 10/09**: `backup-comum.php`, `backup.php` (só CLI), bloco na Manutenção com download, `caixa.php` e `mutirao.php` entraram na lista do que se zera, `testes/acoes/backup.test.ts`.
2. ~~**Hub em cinco blocos** (1.1) + `/painel/gente` (2.2)~~ — **feito em
   10/09**: hub com quatro seções e até três cartões, "quem te acompanha", "a
   operação hoje" e o grupo (depois de entrar) viraram `.hub-linha`; um
   encontro e "ver todos"; formação só com o próximo passo; `gente.php` como
   tela pessoal com abas Todas · Esfriando · Sem estudar, item solto no menu
   com selo, tarefa no `agora.php`, RewriteRule em `publish.yml`;
   `testes/fumaca/gente.test.ts` e o teto do hub em `painel.test.ts`. "O que
   andou acontecendo" ficou **inteiro** no hub até Leituras existir — cortar a
   três linhas antes de haver outro lugar seria esconder sem mostrar; cai para
   três no item 7. De passagem: o hub lia `$motivo['nome']` de um motivo que
   não tem `nome` — o selo de quem esfriou saía vazio; a tela nova lê pelo
   catálogo `MOTIVOS_REATIVACAO`.
3. ~~**Munição em abas e no padrão** (1.2)~~ — **feito em 10/09**: `municao.php`
   virou rota fina + `municao-acoes.php` + `municao-tela.php` +
   `municao-mutirao.php` + `municao-pecas.php`; abas Mutirão da semana (com
   histórico das semanas anteriores) · Peças; a gravação de "postou" virou
   `registrar_postagem()` em `kit-comum.php`, chamada pelos três pontinhos
   (alterna) e pelo botão do Início (só afirma); `testes/acoes/mutirao.test.ts`
   ganhou os quatro casos.
4. ~~**Grupo Administração** (1.5)~~ — **feito em 10/09**: `GRUPOS_NAV` ganhou
   o quarto grupo com Pessoas e Caixa; `testes/contrato/painel.test.ts` cruza
   `CAPACIDADES` × `GRUPOS_NAV` e exige que toda área sem capacidade more lá, e
   só ela.
5. ~~**`privacidade.php`**~~ — **feito em 10/09**: `pode_ver_telefone()`,
   `nome_encoberto()` e `telefone_encoberto()` saíram do `eventos-comum.php`
   (que passa a incluir o arquivo novo — nenhuma tela mudou); a linha do tempo
   inclui `privacidade.php` direto.
6. ~~**`acoes-comum.php`**~~ — **feito em 10/09**, antes do item 3 porque o
   destrava: `avisar()`, `ir_para()`, `exigir_token_de_acao()` e
   `recado_pendente()`; os nove `-acoes.php` e as dez rotas passaram a usar;
   `agenda-acoes.php` usa `avisar()`/`ir_para()` mas guarda a trava própria
   (tem dois fluxos com rascunho); `testes/contrato/painel.test.ts` prende as
   três regras.

### 30 a 60 dias — nomear a leitura

7. ~~**Leituras** (2.1) com Origem, Território, Semana e Atividade~~ — **feito
   em 10/09**: área `leituras` na capacidade `coordenacao`; `leituras.php` +
   `-tela` + `-comum` (placar, funil e região saíram de `inscricoes-comum`) +
   uma aba por arquivo; "De onde vêm" e "Onde a militância mora" saíram de
   Inscrições (o link antigo redireciona); o hub caiu para três linhas de
   atividade e ganhou "ver a semana"; `testes/acoes/leituras.test.ts` prova
   que nada grava, e os testes da linha do tempo migraram para a aba.
8. ~~**Ficha de pessoa sozinha na tela** (1.4)~~ — **feito em 10/09**:
   `pessoas?p=` desenha `tela_da_ficha()` com abas Ficha · Encontros · Acesso
   · Histórico e "Todas as pessoas" para voltar; a lista não vem junto;
   `?p=X&editar=X` abre o modal por cima; as ações de acesso voltam para a aba
   Acesso; Duplicatas virou aba da lista, que só existe quando há par.
9. ~~**`dominio.php` e `util.php`** saindo de `sessao.php`~~ — **feito em
   10/09**, e `pessoas-modelo.php` junto: `sessao.php` caiu de 1378 para 543
   linhas e ficou só com sessão, login, token, tema e `exigir_*`; os testes de
   contrato passaram a ler `dominio.php`.
10. ~~**`agora.php` por registro** (3.2)~~ — **feito em 10/09**: as três
    cadeias de `if` viraram `pendencias_*`, `medidores_*` e `estado_*` no
    `-comum.php` de cada área (fatos, produção, encontros/agenda, inscrições,
    pessoas/gente); `agora.php` percorre `ORDEM_AGORA` e caiu de 842 para 422
    linhas; o teste de contrato cobra que função declarada esteja ligada.

### 60 a 90 dias — fechar a arquitetura

11. **Leituras › Encontros e › Formação** — as duas derivações novas.
12. **`escala-comum.php` e `presencas-comum.php`**; `componentes.php`;
    `index-*.php`; `limite-comum.php`.
13. Decidir com uso real: Mutirão sobe para a lateral? Leituras precisa de
    gráfico? Ajustes por tela vale a porta?

## O que não fazer

- **Não** renomear `kit-*`, `api/kit.php` nem a rota `/kit` — decisão de
  compatibilidade já tomada.
- **Não** criar `dados/atividade.php`, `dados/leituras.php` nem qualquer cache
  de leitura: tudo em Leituras e Atividade é derivado na hora. O dia em que a
  derivação ficar lenta, o problema é o tamanho da base, e aí o cache é decisão
  consciente, não atalho.
- **Não** promover para a lateral sem rotina medida. Mutirão, Follow-up e
  Duplicatas nascem como aba e provam o uso antes.
- **Não** quebrar os cinco arquivos num commit só. Um por vez, suíte verde
  entre cada, e o arquivo antigo incluindo os novos para nenhuma tela mudar.
- **Não** tocar `next.config.ts`, o `.htaccess` gerado ou `conceito.html`.
  Em `publish.yml` entram **só** as duas RewriteRules das rotas novas
  (`^painel/leituras/?$` e `^painel/gente/?$`), no formato das que já estão lá
  — decidido em 10/09; nada mais muda no workflow.

## Como saber que deu certo

- Abrir o painel no celular e chegar à fila do dia sem rolar.
- Uma líder responder "quem da minha gente esfriou?" em uma tela, sem abrir
  Pessoas (que ela não tem).
- A coordenação fazer a leitura semanal em Leituras sem passar por Inscrições.
- Área nova entrar com quatro arquivos e uma função `pendencias_*`, e o teste de
  contrato dizer o que faltou antes do deploy.
- Nenhum arquivo do painel acima de 800 linhas, fora `aulas-conteudo.php` e
  `painel.css`, que são conteúdo.
- Um zip de ontem em `dados/backups/` todo dia.
