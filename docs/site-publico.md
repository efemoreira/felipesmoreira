# Site público

## Arquitetura-base

- Next.js 15 App Router com `output: "export"`.
- Hospedagem estática via Apache/Hostinger.
- Backend dinâmico fora do App Router, em `public/painel/`.
- Tailwind v4 existe **por causa do Estúdio** (241 classes utilitárias lá); o site público não usa nenhuma, e a identidade sai de `src/lib/theme.ts`.

## Estrutura de `src/`

```text
src/
  app/                rotas finas
  features/<nome>/    UI, fluxo, estado e conteúdo por área
  components/         primitivas compartilhadas
  lib/                tema, helpers e clientes de API
  data/               JSON estático versionado
```

Regras:

- `src/app/<rota>/page.tsx` só faz metadata + delegação.
- Estado e efeitos ficam em `features/`.
- Conteúdo tipado pode morar em `features/<nome>/data.ts`.
- A home mora em `features/home/` (`Home.tsx` + `data.ts`) e os textos
  legais em `features/legal/{privacidade,termos}.ts` desde 12/09 — nenhuma
  rota é exceção à regra.
- O Estúdio é exceção: é um produto à parte em `src/app/painel/estudio/`.
- Toda rota do sitemap (fora as legais) tem `opengraph-image.tsx` próprio e
  `twitter` espelhando o `openGraph` — o X não herda do openGraph.
  `testes/contrato/og.test.ts` cobra.

## Tema e tokens

- Fonte única: `src/lib/theme.ts`. (Duas exceções conhecidas e a corrigir:
  `programacao/ProgramacaoClient.tsx` e `CompartilharClient.tsx` redefinem as
  fontes, e `programacao/tipos.ts` reexporta o tema. Não copie o padrão.)
- O cartão OG (`src/lib/ogCard.tsx`) usa as mesmas fontes, lidas de
  `src/lib/fontes/*.ttf` no build — o Satori não lê woff2.
- Use `C`, `FONT_ALFA`, `FONT_ELITE`, `FONT_BITTER`, `BORDA`/`borda()` e `TEXTO`.
- Não escreva `3px solid` à mão.
- A sombra dura sai de `sombra()` / `sombraErguida()` / `sombraAfundada()`.
- Três degraus, e só três: `rente` (3), `cartao` (5), `alto` (8). A opacidade é
  fixa; o que muda com a altura é o deslocamento.

## Frentes públicas principais

### Missão, propostas e número

- Felipe é vice, então o voto vai no número do titular.
- A faixa pública mostra número e data; a explicação vive em `/amissao`.
- Em `/propostas`, número sem página do plano é bug.

### Munição

- `/municao` é ferramenta de circulação por link, sem indexação.
- Atribuição usa `?de=<slug>`.
- Os nomes internos `kit-*` continuam por compatibilidade.

### Resultados 2026

- `/resultados` é estudo interno do 1º turno (votos, cadeiras, quociente, legenda, conversão do Renan, cadeiras, candidatos e adversários — por Brasil, estado, município e bairro), sem indexação e fora do sitemap, como a Munição.
- Os dados são JSON estático em `public/resultados-2026/` (`resumo.json`, `uf/<uf>.json`, `mapa/<uf>.json`), gerados fora deste repositório pelo projeto de análise do TSE: `python -m src.cli export-site --dest <este repositório>/public/resultados-2026`. Não edite esses arquivos à mão; gere de novo.
- Gráficos e mapas são HTML/SVG próprios (sem biblioteca); as cores de dado saem de `DADO` em `src/lib/theme.ts`.
- A UI mora em `src/features/resultados/`; a rota é `src/app/resultados/page.tsx`.
- **Bairros e adversários** saem dos Dados Abertos do TSE (votação por seção + cadastro dos locais de votação, 2022/2024/2026) cruzados com a malha de bairros e distritos do IBGE (Censo 2022). No projeto de análise: `python -m src.cli bairros --baixar --apagar-zip` (baixa UF por UF e apaga o zip da seção depois de processar; disco curto) e `export-site`. A conferência (`data/reports/conferencia_secoes.csv`) compara a soma das seções com o total oficial; `bairros` falha acima de 0,5% numa UF.
- Arquivos: `bairros/<uf>/<município TSE>.json` (bairros, locais, candidatos, quedas e fracos por bairro — bairro e pessoa por índice), `mapa-bairros/<uf>/<município>.json` (SVG pré-projetado, locais em x/y no mesmo desenho) e `adversarios/<uf>.json` (pessoas 22→24→26 casadas pelo título de eleitor, que nunca sai do projeto de análise; no site a pessoa é o SQ do candidato).
- Recorte por bairro: todas as cidades do CE e, nas outras UFs, só as cidades a partir de 50 mil eleitores (62% do eleitorado do país). As ~4 mil cidades pequenas eram 3/4 do tamanho e ficam no nível de cidade. A regra vai em `resumo.bairrosCorte` e o site lista as cidades por ela (`temBairros()`); muda com `export-site --bairros-completos ce sp --bairros-min-eleitores 20000`.
- Teto: a pasta inteira fica abaixo de 80 MB (`export-site` falha acima disso, e `testes/contrato/resultados.test.ts` prende). O deploy empurra `public/` para a branch `build`, então cada regeração entra de novo no histórico: regere depois da totalização, não a cada ajuste.
- **Pautas** dos adversários: Dados Abertos da Câmara (projetos de 2023–2026 em que a pessoa é primeira autora, com o tema da Câmara), casados com a ficha do TSE por nome civil + data de nascimento (módulo `camara` do projeto de análise). Só existe para quem foi deputado federal na legislatura; estadual e senador não têm base pronta.
- **Decisões** (aba), só para o Missão: cada cidade do estado e cada bairro de uma cidade na **situação do 14** — Convertido, Potencial, Base de candidato, Fora da base — pela propensão ao 14 (fatia do Renan ÷ a da régua) e pela conversão (melhor chapa do Missão ÷ Renan, contra a da régua); régua = estado para cidades, cidade para bairros. Por candidato do Missão, o voto **puxado pelo 14** (taxa típica dele — mediana de votos ÷ Renan entre os lugares — × Renan no lugar) e o **próprio** (votos − puxado): o melhor lugar de fato, cidade e bairro, é onde o próprio é maior. Cálculo no módulo `forca` do projeto de análise; colunas `i14`, `conversao`, `conv_rel`, `situacao`, `a_converter`, `melhor_nome`, `melhor_proprio` e tabela `proprio` (`votos`, `puxado`, `melhor_bairro`, `mb_votos`, `mb_puxado`) em `uf/<uf>.json` e nos arquivos de bairro; `voto_puxado`, `voto_proprio`, `k_renan` em `resumo.candidatos`.
- **O número faz diferença?** (aba Candidatos): `resumo.efeitoNumero` — por UF e cargo, o número que repete o 14 contra o melhor dos outros do Missão (fatia, lugar, votos por 100 do Renan, % que acompanha o 14, estreante). É evidência, não prova; o texto da página diz as duas coisas.
- **Onde temos gente**: a aba Decisões pergunta a `/painel/api/gente.php` (via `apiFetch`) os totais de pessoas por cidade e bairro, por tipo — só com sessão no painel e a área Pessoas; nenhum nome, telefone ou id sai do endpoint (`testes/acoes/gente.test.ts` prende). Sem sessão, a coluna some e a página diz como entrar.
- **Partidos** (aba): de que é feito o voto de cada partido no Brasil, estado, cidade ou bairro — % legenda, % do puxador, candidatos com voto, nomes para 80% do nominal, eleitos e nomes com 10% do QE — e o Missão contra os que elegeram (ou os 5 maiores, na cidade e no bairro). Perfil em código curto no JSON (`MP`, `M`, `P`, `C`, `N`), traduzido por `PERFIL` em `apoio.ts`; regra no módulo `perfil_partidos` do projeto de análise. Arquivo `partidos/<uf>.json` (estado + cidades) e tabela `partidos` nos arquivos de bairro (8 maiores por cargo + Missão).
- **Por dentro do Missão** (Estado, Município, Bairro): cada nome com a fatia do voto do partido ali, a fatia dos válidos e o lugar entre todos os candidatos do cargo (`posicao_uf`/`total_uf` no resumo, `posicao`/`total_cand` em `uf/<uf>.json`, `posicao` e `total_cand_<cargo>` nos arquivos de bairro).
- **Movimento (antes do partido)** (aba Candidatos): quem já era do movimento quando o Missão não existia (Pedro Arthur, vereador em Fortaleza em 2024; Kim Kataguiri e Guto Zacarias, 2022 em SP). Trajetória 22→24→26, herança (correlação da base de antes com a chapa do Missão 2026 sem ele, contra todos os outros candidatos de direita e centro da mesma eleição), retenção e canibalização para quem concorreu em 2026, e o futuro como vereador em 2028 na cidade-base. A lista fica em `MOVIMENTO` no módulo `movimento` do projeto de análise (por candidatura: ano, UF, unidade, cargo, número — sem dado pessoal); `resumo.movimento` no site. Voto anulado sub judice conta como base (é eleitor real que digitou o número).
- Não há aba de ideias: a página mostra números por nível (Brasil, estado, município, bairro) e a avaliação fica com a coordenação.
- O que cada número quer dizer fica em `explicacoes.ts` (a caixa "Sobre este dado" de cada `<Secao explica="…">` e a aba "Sobre os dados"). Seção nova com número novo ganha texto lá.

### Programação

- A agenda pública é derivada dos encontros do painel.
- Toda conta de tempo sai de `inicio`, nunca de `data`.
- `estadoDe()` (TS) e `estado_do_evento()` (PHP) têm de concordar.

### Funções

- `src/data/funcoes.json` é a fonte única dos papéis da militância.
- `/funcoes` é catálogo público com âncoras.
- `/queroajudar?funcao=<id>` abre o formulário com a função marcada.

### Candidatos

- Candidato e lista são coisas diferentes.
- A colinha respeita a ordem da lista.
- O site exibe o rótulo do cargo vindo do PHP, não replica a tabela em TS.

## Fluxos públicos

### Inscrição

- Fluxo crítico de entrada da militância.
- A tela ajuda mais do que o servidor exige; o servidor aceita mais do que a UI pede.
- O rascunho usa `sessionStorage` (`CHAVE_RASCUNHO`).

### Presença

- Dois tokens: confirmação e presença na porta.
- O fluxo reaproveita a mesma régua de validação da inscrição.
- A passagem para `/queroajudar` envia dados por `sessionStorage`, nunca por querystring.

## Responsividade

- `html { overflow-x: clip }` em `src/app/globals.css` trava rolagem horizontal global.
- Inputs públicos ficam com mínimo de 16 px para não disparar zoom no Safari.
- A frente ainda aberta está menos na navegação e mais no excesso de `style={{...}}` e no desenho de listas/tabelas em mobile.

## Imagens

- `public/` vai para o build sem otimização do Next.
- Verifique peso antes de colocar imagem nova em `public/`.
- Originais ficam em `originais/`.