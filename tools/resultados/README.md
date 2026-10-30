# Contagem de votos nulos com digitação 14 — segundo turno de 2026

Este coletor publica contagens observadas nos Registros Digitais do Voto
(RDVs). Não calcula apoio, retenção, conversão ou consolidação partidária.
Não associa votos a pessoas nem presume a motivação da digitação.

## Reprodução

Requer Python 3.11 ou superior. Na raiz do repositório:

```sh
python3 -m venv .cache-resultados/venv
.cache-resultados/venv/bin/pip install -r tools/resultados/requirements.txt
.cache-resultados/venv/bin/python tools/resultados/pacotes.py
.cache-resultados/venv/bin/python tools/resultados/localizar.py
.cache-resultados/venv/bin/python tools/resultados/oficiais.py
.cache-resultados/venv/bin/python tools/resultados/exportar.py
.cache-resultados/venv/bin/python -m unittest discover -s tools/resultados -p 'test_*.py'
```

`pacotes.py` usa o catálogo CKAN oficial, o índice central dos ZIPs e HTTP
multipart Range para ler apenas os RDVs. Não baixa os logs ou assinaturas de
todo o país. Cada arquivo é conferido pelo CRC e tamanho declarados no ZIP,
e recebe SHA-256 no cache. Isso não é uma verificação de assinatura digital.
A decodificação usa `spec/rdv.asn1`, extraído sem alterações do
[pacote oficial do TSE](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/formato-arquivos-de-bu-rdv-e-assinatura-digital/@@download/file).

O cache e as contagens por seção ficam em `.cache-resultados/rdv.sqlite`,
fora de `public/` e do Git. O processo retoma seções ainda sem resultado.
Se um pacote tiver entradas duplicadas para a mesma seção, elas não são
somadas. Para pendências, `coletar.py --ufs <uf>` consulta o auxiliar de cada
seção e aceita somente um hash totalizado e um RDV inequívoco. Erros ficam
no SQLite e podem ser tentados novamente. Nenhuma coleta substitui uma
digitação ausente por uma estimativa.

## Critério de contagem

- Pleito 3221, fase oficial 2; Presidente 6258, cargo 1; Governador 6260,
  cargo 3. São conferidos município, zona e seção dentro de cada RDV.
- Conta somente `tipoVoto = 4` e `digitacao = "14"`. Um voto nominal com 14
  ou um nulo com outra digitação não entra nessa contagem.
- Presidente e governador permanecem separados. Somar os cargos não
  representa quantidade de pessoas distintas.
- O índice de seções do TSE define os RDVs esperados. Seção agregada, com
  `nsp`, é contabilizada apenas na seção principal.
- O rótulo **Conferido** exige todos os RDVs esperados e concordância com a
  totalização oficial do município: total de votos, brancos, nulos, nominais
  e a votação nominal de cada número. Municípios com leitura parcial ou
  divergências recebem o estado correspondente. Isso confere as contagens
  agregadas, sem certificar cada dígito nulo por uma segunda fonte.
- Localidades sem nenhuma seção instalada e com zero votos segundo o TSE
  recebem **Sem seção instalada**. Apenas nesse caso as respectivas seções
  são excluídas dos RDVs esperados, com a lista preservada na conferência.
  O zero é confirmado pela totalização oficial; não é uma imputação para
  arquivo ausente. Outras ausências continuam pendentes.

## Localização

O RDV identifica o local de votação. Ele é associado ao cadastro **do
segundo turno**, pela UF, município TSE, zona e número do local. Telefone
do local e informações de eleitores não são exportados.

O ponto GPS é cruzado com a malha de bairros do IBGE, Censo 2022, no mesmo
sistema de coordenadas. Só se aceita interseção com **um único bairro do
mesmo município IBGE**. Pontos em fronteiras não recebem arbitrariamente
um dos bairros. Sem correspondência única, usa-se o bairro cadastral do
TSE, identificado como tal. Local ausente, cadastro conflitante ou bairro
ausente é mantido com a indicação da limitação. O bairro é o **do local de
votação**, não o da residência de quem votou.

Locais transferidos: quando a seção do cadastro do segundo turno informa
explicitamente o mesmo número do RDV como local original, os votos são
agregados no local atual indicado pelo TSE. O export preserva os números
originais em `locais_rdv` e informa o método em `vinculo_local`. Uma relação
ambígua de seção/local não é resolvida por suposição.

Todas as localidades do índice nacional, incluindo o exterior, entram com
total municipal no export. Para bairros e locais, o export verifica se o
arquivo de bairros da cidade no primeiro turno existe e contém linhas.
Isso preserva a cobertura efetiva anterior: Ceará completo e, nas demais
UFs, cidades com pelo menos 50 mil eleitores. A coluna `recorte` indica
**Total municipal** ou **Bairros e locais**. A disponibilidade de bairro
IBGE não é a mesma em todo o país.

## Arquivos publicados

O export gera `public/contagem-2026-2t/`, separado dos dados do primeiro
turno. Não editar seus JSONs manualmente.

- `resumo.json`: Brasil e exterior, UFs, cobertura, estado de conferência e
  links das fontes oficiais.
- `uf/<uf>.json`: contagens e cobertura por município/localidade.
- `cidades/<uf>/<municipio>.json`: bairros e locais, com endereço,
  coordenadas disponíveis e origem da localização. Um bairro é uma linha:
  local do cadastro TSE com o nome de um bairro IBGE da mesma cidade entra
  nele (`IBGE · nome do cadastro`); grafias que só diferem no acento viram
  um bairro. `locais_rdv`, `vinculo_local` e `localizacao` só vêm quando
  diferem do caso comum.
- `votos14_1t` (todas as camadas): votos nominais no 14 para Presidente no
  1º turno, lidos de `public/resultados-2026/` — por município, e por local
  (zona + número) nos bairros e locais. Bairro com algum local sem par no 1º
  turno fica sem a referência. Nota: em BA e MG a soma das cidades do 1º
  turno fica 9 e 97 votos abaixo do total do estado no `resumo.json` do 1º
  turno; aqui vale a soma das cidades.
- `conferencia.json`: conferência por município/cargo e seções pendentes.
- `explorar/<uf>/<municipio>.json`: o 2º turno nos bairros **do 1º turno**
  (`bairro_chave`), local por local pelo número original do local de
  votação; local sem par fica em `t2_votos_fora`. Cada local em `cidades/`
  traz `bairro_1t`. É o que o Explorador de `/resultados` junta às linhas
  do 1º turno.
- `t2_fiel_aj` (cidades em `uf/`, bairros em `explorar/`): nulos com 14 ÷
  14 no 1º turno, puxado para o nível de cima com peso `k` em votos
  (`resumo.fidelidade.k_cidade`/`k_bairro`), estimado pelo método dos
  momentos — a variação entre lugares que sobra depois do acaso de contagem.
- `resumo.fidelidade.referencia`: a mesma razão para os outros candidatos a
  Presidente eliminados no 1º turno com 100 mil votos ou mais, a partir do
  total oficial (`oficiais.py` guarda `oficiais-1t/br-1.json`, eleição 6257).
  Números menores coincidem com digitação comum e ficam de fora.

O site junta o 2º turno ao Explorador de `/resultados` (não há aba própria;
o link antigo `#segundo-turno/<uf>/<cidade>` abre a cidade lá). O CSV respeita os filtros e inclui todas as linhas
filtradas, inclusive as ainda não visíveis na paginação.

Fontes: [arquivos de urna do TSE](https://dadosabertos.tse.jus.br/dataset/resultados-2026-arquivos-transmitidos-para-totalizacao),
[locais de votação](https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip),
[bairros do IBGE](https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/bairros/shp/BR/BR_bairros_CD2022.zip).
