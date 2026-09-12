# Terceira avaliação — o que melhora agora, para quem, com teste

Data: 2026-09-12, fim do dia. A primeira (11/09) deu a nota e o plano; a
segunda (12/09, manhã) refez a nota e olhou as telas. Esta é feita com uma
régua nova, dita pelo Felipe e certa: **não há por que esperar a eleição para
melhorar a vida de quem usa.** Espera só o que reorganiza código sem mudar
nada para ninguém. Tudo o mais entra agora — com teste.

## O dia em números

| | 11/09 | 12/09 manhã | **12/09 noite** |
| --- | --- | --- | --- |
| Testes | 339 | 495 | **519** (48 arquivos) |
| Itens do plano feitos | 0/36 | 17/36 | **24/36** |
| Commits do dia | — | 30 | **49** |
| Para o militante | — | — | primeiros passos no hub |
| Para a coordenação | — | `/ajuda` | CSV × 3, Playbook fechado |
| Para a administração | trava adm, `flock` | backup antes de zerar | idade do backup na fila, teto na escala |
| Para a pessoa cadastrada | — | — | dossiê (LGPD), apagar a pedido, lápide |
| Para quem mantém | — | `comece-aqui`, CI | rastro (quem alterou, quem apagou) |

## A nota, refeita com os mesmos critérios

| Visão | Peso | 11/09 | manhã | **noite** | O que moveu à tarde |
| --- | --- | --- | --- | --- | --- |
| 1. Site de militância | 20% | 6,5 | 8,3 | **8,3** | — (medição só sobe com semanas de dado) |
| 2. Design | 10% | 7,0 | 7,2 | **7,2** | — |
| 3. Programação | 15% | 7,0 | 8,2 | **8,2** | — |
| 4. Administração | 20% | 5,5 | 7,1 | **8,0** | backup 8→9 · observabilidade 2→4 · LGPD 5→8 |
| 5. Ferramenta de edição | 10% | 7,0 | 7,6 | **7,6** | — |
| 6. Ferramenta de organização | 15% | 6,0 | 6,0 | **7,2** | semana/mês 3→5 (CSV) · rastro 3→8 |
| 7. Entrada | 10% | 6,0 | 8,0 | **8,3** | militante 7→8 (primeiros passos) |
| **Geral** | | **6,4** | **7,6** | **7,9** | |

(A anotação "8,1" no roteiro estava otimista; 7,9 é a conta.)

Os critérios que ainda estão abaixo de 6, e por isso são o mapa do que vem:
**observabilidade 4**, **aulas 4**, **componentização 4**, **tokens 5**,
**semana/mês 5**. Nenhum deles espera mais nada além de mão.

## Os olhares — o que cada um vê hoje, e o que faria agora

### 1. O militante

*Vê:* três passos ao chegar; a mesa da função; a fila; a peça da semana; a
formação com o próximo passo; quem o acompanha.
*Dói:* a peça da semana só existe se a coordenação escalou — e a Munição
vazia diz "crie a peça na aba Peças" sem botão; o hub inteiro só volta
quando os três passos estão feitos, mas o terceiro ("fez algo na mesa")
depende de a mesa ter tela para ele (`estudio` e `agenda` não contam).
*Agora:* estado vazio com botão em toda tela (padrão, não caso a caso);
`ja_fez_algo_em()` cobrindo agenda e estúdio (estúdio não grava — vale
"abriu").

### 2. A coordenação

*Vê:* fila, Inscrições em duas abas, Leituras em seis, CSV, Ajuda, a
lápide de quem apagou.
*Dói:* a ficha de quem está "esperando aprovação" não tem o botão de
aprovar — é ir a Inscrições, achar de novo; o encontro tem três botões
visíveis por peça e a régua diz um; "Quando" do fato sai em ISO
(`2026-08-20`); nenhuma tela tem **estado vazio com ação**.
*Agora:* aprovar/recusar direto da ficha; datas humanas nos fatos; o
padrão de vazio-com-botão.

### 3. A administração

*Vê:* trava de adm real, backup com idade, zerar com zip antes, tentativas
por endereço, dossiê e apagar a pedido, quem apagou o quê.
*Dói:* **observabilidade 4** — erro de PHP em produção some no
`display_errors=off`; não há uptime; a senha provisória passa pela sessão
em texto por um segundo. E o `.lock` de `com_trava()` só vale enquanto o
Apache e o cron rodarem na mesma máquina (verdade na Hostinger; anotar).
*Agora:* `error_log` em `dados/erros.log` com o bloco "Erros dos últimos 7
dias" na Manutenção (item 35, a metade que é código — 3 h); o monitor
externo é cadastro, não código.

### 4. O eleitor

*Vê:* cartão certo em toda rota, o número sempre, o convite quando a lista
não vem, a home no celular sem vazar.
*Dói:* `/programacao` sem publicação nenhuma (a semente ficou vazia de
propósito) — conferir o estado vazio; `/aulas` e `/presenca` no `next dev`
vazios (documentado no `comece-aqui`, não é bug).
*Agora:* o estado vazio da programação com a faixa da eleição e o link do
YouTube — uma hora.

### 5. Quem mantém

*Vê:* 519 testes, dois workflows, `comece-aqui`, docs presos por teste,
rastro sem log.
*Dói:* `layout.php` com **324 linhas de JS inline** (sem cache, sem CSP
possível); **158 `style=`** e **11 `<form style="display:inline">`** no
painel contra a própria regra da casa; no site, 52 `2px solid`, 7 `HATCH`,
167 hexadecimais; nove áreas sem `estado_*()` (o hub sabe da metade). A
suíte em 63 s.
*Agora:* `painel.js` (é moldura, mas é mover, não reescrever — 4 h, com a
fumaça inteira como rede); `estado_*()` para as nove áreas (2 h);
`BORDA_FINA` e a paleta de erro única (item 19, 8 h). O que fica para
depois é só o que muda 13 arquivos de uma vez sem ganho visível (home fina,
Tailwind fora) — e mesmo isso cabe numa tarde com a suíte verde.

### 6. O dado

*Vê:* 128 KB local; lápides no mesmo arquivo; `.lock` ao lado.
*Dói:* sem medidor de tamanho e tempo; `pessoas_por_telefone()` varre tudo
a cada busca na porta.
*Agora:* Leituras › Semana mostra "pessoas.php: N fichas, N KB, leitura em
N ms" — uma hora, e é o número que decide o índice (item 33).

### 7. O dia da eleição

*Vê:* backup avisado, conta que não tranca, QR com tranca, fases no
cliente.
*Dói:* a home do dia 05 (aposta 5 — texto seu); ninguém além do Felipe
publica; uptime sem monitor.
*Agora:* os três são seus: escrever o texto, dar acesso a uma segunda
pessoa com o `comece-aqui` cronometrado, cadastrar o monitor.

## A lista — o que fazer agora, na ordem

Cada item com teste; nenhum espera data. Horas são de uma pessoa que já
conhece o repositório.

| # | Para quem | O quê | h |
| --- | --- | --- | --- |
| 1 | coordenação | Aprovar/recusar direto da ficha de quem está pendente | 3 |
| 2 | todos | **Estado vazio com botão** em toda tela — um `vazio()` em `componentes.php` com texto + ação, e cada tela usa | 4 |
| 3 | administração | `error_log` em `dados/erros.log` + "Erros dos últimos 7 dias" na Manutenção | 3 |
| 4 | quem mantém | `painel.js` fora do `layout.php`, com `?v=` — depois, CSP com nonce | 4 + 3 |
| 5 | ~~`estado_*()` nas nove áreas~~ — **retirado**: `estado_*()` só é desenhado nas mesas, e as mesas apontam só para eventos, fatos e produção, que já o têm. Nove funções que nenhuma tela mostra seriam código morto. Achado errado da terceira leitura. | — |
| 6 | coordenação | Datas humanas nos fatos; um botão visível por ficha do fato. (Os três botões da escala ficam: decisão documentada — "três toques em momentos diferentes".) | 2 |
| 7 | o dado | Medidor de `pessoas.php` em Leituras › Semana | 1 |
| 8 | eleitor | Estado vazio de `/programacao` com a faixa e os canais | 1 |
| 9 | militante | `ja_fez_algo_em()` para agenda e estúdio | 1 |
| 10 | quem mantém | `BORDA_FINA`, paleta de erro única, `HATCH` num lugar — com teste barrando o retorno | 8 |
| 11 | coordenação | Aulas editáveis por patch (`dados/aulas-texto.php`) — o maior, e o que tira "aula é código" de 4 | 12 |
| 12 | coordenação | Metas nos medidores (`dados/metas.php`) | 6 |
| 13 | coordenação | Tarefas com dono e prazo | 10 |
| 14 | ~~Escala para quem não tem conta~~ — **já existia**: o seletor de responsáveis e a sugestão incluem quem pediu a função sem conta, e o convite responde por token (`eventos-dados.php`). Achado herdado de uma leitura antiga de `pessoas_ativas()`. | — |
| 15 | administração | Importar planilha | 10 |

Os itens 1–9 cabem em **dois dias**; levam a nota a ~8,3. **Feitos em
12/09, à noite** (1, 2, 3, 4, 6, 7, 8, 9; o 5 caiu): `c5…`–`0664fb2`. Os 10–15, uma
semana; ~8,7.

## O que continua não sendo código

- O texto da home para 05/10.
- Uma segunda pessoa com acesso ao repositório e ao hPanel — e o
  `comece-aqui.md` cronometrado por ela.
- Um monitor de uptime cadastrado.
- Um encontro real com o celular na mão.

## Como saber que deu certo

- Nenhum critério abaixo de 6 em 11/12; geral ≥ 8,5.
- Nenhuma tela do painel com estado vazio sem botão (teste de fumaça
  procura `class="vazio"` sem `<a` ou `<button` dentro).
- Um erro de PHP em produção aparece na Manutenção em até um dia.
- `layout.php` sem `<script>` inline; CSP no ar.
- A coordenação aprova alguém a partir da ficha sem passar por Inscrições.
