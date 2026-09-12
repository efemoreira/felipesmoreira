# Painel — felipesmoreira.com/painel

Guia operacional do painel PHP. O rational detalhado e as decisões maiores da
arquitetura agora vivem nos docs temáticos.

## Onde ler o detalhe

- `docs/arquitetura-completa.md` — mapa geral da arquitetura.
- `docs/painel-ui-e-permissoes.md` — navegação, busca, modais, áreas e padrão das telas.
- `docs/dominio-e-fluxos.md` — inscrição, presença, origem, pessoas e contrato com o site público.
- `docs/deploy-testes-e-limites.md` — testes, deploy, `.htaccess`, limites e cuidados de produção.

## O que o painel é

O painel roda em PHP ao lado do site estático exportado pelo Next. Ele cuida de:

- autenticação e sessão;
- inscrições, pessoas e permissões;
- encontros, presença e funil;
- fatos, produção e munição;
- edição da formação;
- programação e dados dinâmicos do movimento.

Também expõe APIs JSON em `public/painel/api/` para o site público consumir.

## Arquivos centrais

| Arquivo | Papel |
| --- | --- |
| `public/painel/sessao.php` | sessão, login, token, tema, `exigir_*` — inclui os três abaixo |
| `public/painel/dominio.php` | `AREAS`, `CAPACIDADES`, `TIPOS_PESSOA`, `REDES`, `CARGOS`, `DESTINO_AREA`, `GRUPO_TRABALHO` |
| `public/painel/util.php` | `h()`, `limpar_texto()`, `sem_acento()`, telefone/WhatsApp, municípios — sem efeito colateral |
| `public/painel/pessoas-modelo.php` | `normalizar_pessoa()`, `ler/gravar_pessoas()`, `achar_*` — a única porta para `dados/pessoas.php` |
| `public/painel/layout.php` | moldura, navegação, busca global e rascunho local — inclui `componentes.php` |
| `public/painel/componentes.php` | `barra_abas()`, `barra_busca()`, `barra_filtros()`, modal, `menu_acoes()`, `links_whatsapp()`, `campo_cidade()`, `recado()` |
| `public/painel/limite-comum.php` | o teto de envios dos endpoints públicos (`passou_do_limite()`, `registrar_envio()`) |
| `public/painel/index.php` | a rota; `index-acoes.php` (entrar, sair, primeiro admin), `index-login.php` (a porta), `index-hub.php` (o Início) |
| `public/painel/agora.php` | a fila do dia e o panorama — percorre `ORDEM_AGORA` e chama `pendencias_*`/`medidores_*`/`estado_*` de cada `-comum.php` |
| `public/painel/*-acoes.php` | POST das telas grandes |
| `public/painel/*-tela.php` | tela principal das áreas já cortadas |
| `public/painel/*-comum.php` | leitura, gravação e regras do domínio |
| `public/painel/escala-comum.php` | as peças do encontro, o preparo, os convites e a escala sugerida (incluído por `eventos-comum.php`) |
| `public/painel/presencas-comum.php` | presenças e o funil D+0 · D+3 · D+7 — a única porta para `dados/presencas.php` (incluído por `eventos-comum.php`) |
| `public/painel/leituras-comum.php` | placar e funil de origens, militância por região — derivados, para `/painel/leituras` |
| `public/painel/privacidade.php` | a regra de dado pessoal: `pode_ver_telefone()`, `nome_encoberto()`, `telefone_encoberto()` |
| `public/painel/acoes-comum.php` | `avisar()`, `ir_para()`, `exigir_token_de_acao()`, `recado_pendente()` — o POST-redirect-GET num lugar só |
| `public/painel/backup-comum.php` + `backup.php` | o zip de `/dados` — botão da Manutenção e cron |
| `public/painel/aulas-texto.php` | o patch de texto das aulas (`dados/aulas-texto.php`) — `curriculo_vigente()`, o editor na aba Conteúdo, o consolidado na Manutenção |
| `public/painel/erros-comum.php` | o registro de erros de produção (`dados/erros.log`) e o bloco da Manutenção — ligado só quando `display_errors` está desligado |

## Primeiro acesso

1. Abra `/painel/`.
2. Se ainda não existir usuário, crie o primeiro administrador na hora.
3. Depois disso, o login normal passa a ser a única porta de entrada.

Enquanto não existir nenhum usuário, qualquer pessoa que chegue a `/painel/`
pode criar o administrador. Não deixe essa janela aberta.

## Onde os dados ficam

O painel grava em `public_html/dados/`, fora do repositório. Um deploy não pode
apagar o que foi editado por uso do sistema.

Regras importantes:

- dado sensível fica em arquivo `.php` retornando array;
- `agenda.json` é a exceção pública para `/programacao`;
- imagens da agenda continuam públicas por extensão;
- segredos, tentativas, pessoas, fatos, produção e encontros não podem ir para
  arquivo legível pela web.

### Backup

- `backup-comum.php` gera um zip de `/dados` inteiro (inclusive `segredo.php`
  e as imagens) em `dados/backups/`, que o `.htaccess` fecha para a web.
  Ficam os 14 mais recentes.
- Dois caminhos, uma função: o botão em `/painel/manutencao` e o cron da
  hospedagem — `0 3 * * * php public_html/painel/backup.php`. O `backup.php`
  responde 404 fora da linha de comando; não existe URL que dispare backup.
- Baixar é `manutencao.php?baixar=<nome>`, só `adm`, e o nome tem de casar com
  `FORMA_NOME_BACKUP` — nada que vem da URL vira caminho sem passar por
  `backup_por_nome()`.
- Zerar na Manutenção não apaga backups. `testes/acoes/backup.test.ts` prende
  tudo isso.

## Permissões

- `adm` vê tudo e é a única capacidade que libera `pessoas`.
- as demais capacidades agrupam áreas de trabalho por natureza.
- função da pessoa não limita acesso; ela só personaliza mesa, destaque e fluxo.
- **nome e telefone de gente são de `adm` e `coordenacao`.** Quem tem só
  `eventos` organiza o encontro e recebe na porta, mas lê o telefone encoberto;
  quem tem só `comunicacao` não chega a nenhum dos dois. O follow-up depois do
  encontro é da coordenação, e é por isso que ela abre `eventos` e `agenda`.

Se a tarefa tocar em capacidade, área, navegação ou dado pessoal, confira também
`docs/painel-ui-e-permissoes.md`.

## Fluxos operacionais mais sensíveis

### Inscrição

- `/queroajudar` cria ou reaproveita uma pessoa com `status = 'pendente'`.
- Aprovar **dá conta à ficha já existente** e mostra senha provisória uma vez.
- Recusar não apaga a pessoa nem o histórico dela.

### Presença

- `/presenca` usa um token para confirmação e outro para presença na porta.
- A presença é relação entre pessoa e encontro; não crie cópias do cadastro.
- O QR da mesa é endpoint público e segue regras próprias de origem, teto e honeypot.

### Fatos e produção

- fato sem fonte primária não entra;
- quem trouxe o fato não checa o fato;
- card publicado é rastro, e rastro não se apaga fora da regra administrativa.

### Encontros

- checklist, presença e follow-up convivem no mesmo domínio do encontro;
- só quem decide mexe em criação, edição, cancelamento e telefone aberto;
- encontro com gente na lista não se apaga.

## Mobile first do painel

O painel precisa funcionar em celular, e várias das rotinas diárias acontecem em
pé, na rua ou na recepção.

Base já existente:

- barra fixa no rodapé no celular;
- abas em link real com URL própria;
- rascunho local em formulários longos;
- busca global na moldura.

Pendência importante:

- telas com `.rolagem` e tabela ainda precisam migrar para listas/cards quando a
  informação for de trabalho diário.

A avaliação completa, a nota por visão e o plano estão em
`update/avaliacao-e-plano-de-crescimento.md`; o passo a passo por critério, em
`update/roteiro-das-notas.md`; a segunda e a terceira leituras, com a nota
refeita, em `update/segunda-avaliacao.md` e `update/terceira-avaliacao.md`.

## Testes

Comandos principais:

```bash
npm test
npm run test:acoes
npm run test:contrato
npm run test:fumaca
npm run test:tipos
npm run lint
```

Hoje o projeto usa três frentes:

- `testes/contrato/`
- `testes/acoes/`
- `testes/fumaca/`

Qualquer mudança em POST crítico ou contrato PHP ↔ TS deve entrar acompanhada de
teste.

## O que não mexer sem perguntar

- `next.config.ts` com `output: "export"`;
- `.github/workflows/publish.yml`;
- regras do `.htaccess` gerado no build;
- `conceito.html`.

## URLs principais

- `/painel/`
- `/painel/agenda`
- `/painel/estudio`
- `/painel/aulas`
- `/painel/fatos`
- `/painel/producao`
- `/painel/eventos`
- `/painel/inscricoes`
- `/painel/candidatos`
- `/painel/pessoas`
- `/painel/leituras` — origem, território, encontros, formação, semana (metas, "O site", medidores, mutirão, caixas), atividade; capacidade `coordenacao`. O único POST é o das metas (`leituras-acoes.php`, `dados/metas.php`) — dado do movimento não se grava aqui
- `/painel/conta`
- `/painel/gente` — tela pessoal de quem acompanha alguém (`pode_liderar()`), não é área
- `/painel/ajuda` — cada tela em três frases e o glossário; gerada de `dominio.php` + `ajuda-comum.php`
- `/painel/exportar` — CSV de pessoas (o recorte da lista), presenças de um encontro e um caixa; só GET, capacidade `coordenacao` (caixa só `adm`)

Os endpoints em `public/painel/api/` continuam sendo chamados pelo caminho real,
sem URL limpa dedicada.
