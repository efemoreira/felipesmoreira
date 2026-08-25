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
| `public/painel/sessao.php` | sessão, permissões, modelo da pessoa, utilitários centrais |
| `public/painel/layout.php` | moldura, navegação, busca global, modais e rascunho local |
| `public/painel/index.php` | login, criação do primeiro admin e hub operacional |
| `public/painel/agora.php` | fonte única das pendências e do panorama |
| `public/painel/*-acoes.php` | POST das telas grandes |
| `public/painel/*-tela.php` | tela principal das áreas já cortadas |
| `public/painel/*-comum.php` | leitura, gravação e regras do domínio |

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

O plano detalhado dessa auditoria está em `update/plano-evolucao-ferramenta-militancia.md`.

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
- `/painel/conta`

Os endpoints em `public/painel/api/` continuam sendo chamados pelo caminho real,
sem URL limpa dedicada.
