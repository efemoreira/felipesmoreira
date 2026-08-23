# Deploy, testes e limites

## Testes

Comandos principais:

```bash
npm test
npm run test:contrato
npm run test:acoes
npm run test:fumaca
npm run test:tipos
npm run lint
```

Tipos de teste:

- `testes/contrato/` — pares PHP ↔ TS e fontes únicas.
- `testes/acoes/` — POST, redirecionamento e gravação.
- `testes/fumaca/` — renderização de tela em silêncio.

Regra prática:

- contrato novo pede teste de contrato;
- POST crítico pede teste de ação;
- refatoração de tela pede fumaça, no mínimo.

## Publish e `.htaccess`

Não mexa sem necessidade em:

- `next.config.ts` com `output: "export"`;
- `.github/workflows/publish.yml`;
- regras de `.htaccess` geradas pelo workflow.

Pontos sensíveis do `.htaccess`:

- `DirectorySlash Off` + ordem da regra de `.html` antes da de pasta;
- `immutable` só onde o nome carrega hash;
- HTML com `no-cache`;
- rotas antigas com `R=301,L,QSA`.

Ao mexer nisso, teste com Apache real, não só com `php -S` ou `python -m http.server`.

## O que não mexer sem perguntar

- `next.config.ts`
- `.github/workflows/publish.yml`
- `conceito.html`

## Convenções de nomes

- Rotas e conteúdo: português.
- Identificadores: português, acompanhando a base atual.
- Slug e nome de arquivo: `sem_acento()` no PHP; `normalize("NFD")` no JS.

## Imagens

- `public/` vai para o build sem otimização do Next.
- Confira o peso antes de adicionar imagem em `public/`.
- Originais vivem em `originais/`.

## Limites e fixtures de teste

- O sandbox de teste é uma cópia do painel, nunca a árvore de trabalho.
- Fixtures em `testes/sandbox.ts` são ambiente de teste, não segredos reais.
- O painel grava relativo a `../dados`; por isso o sandbox existe.