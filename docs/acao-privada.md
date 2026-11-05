# Central privada de Ação

`/acao` reúne os documentos de planejamento do dono, seus checklists e o
diretório de implantação. Fica fora dos menus públicos, do rodapé e do sitemap,
com metadados noindex. `/planos` é um alias para o plano existente em `/plano`;
`/resultados` permanece fora da navegação pública.

## Acesso

- `src/app/acao/page.tsx` exporta somente a interface, delegando para
  `src/features/acao/Acao.tsx`.
- `public/painel/api/acao.php` verifica sessão, capacidade administrativa,
  senha definitiva e a identidade do dono antes de entregar qualquer documento,
  download ou cópia privada.
- `public/painel/acao-comum.php` configura a identidade inicial explicitamente;
  a primeira importação fixa o id da conta em `dados/acao.php`. Outros
  administradores não recebem acesso. Depois de fixado, mudar o login da conta
  não muda a identidade autorizada.
- `public/painel/acao.php` faz a ponte do login existente para `/acao`. Assim o
  cookie continua restrito a `/painel` e as chamadas usam a API autenticada.
- Respostas da API usam `Cache-Control: no-store, private`. O cliente volta a
  verificar a autorização ao retornar à aba e a cada minuto em primeiro plano.

O HTML e o JavaScript exportados são públicos e não carregam o conteúdo dos
documentos. A proteção está no servidor que fornece os dados.

## Conteúdo privado

Documentos e diretório ficam em `dados/acao.php`; marcações em
`dados/acao-progresso.php`. Ambos são arquivos PHP de dados, na pasta bloqueada
pelo `.htaccess` criado por `preparar_pastas()`. Não são versionados nem
incluídos no build da integração contínua.

O renderer Markdown ignora HTML embutido e imagens. Links seguem a transformação
segura do renderer. Referências a outros documentos importados abrem o documento
correspondente dentro da central.

## Preparar e importar

Use `tools/acao/preparar.py` com um manifesto local:

```json
{
  "documentos": [
    {
      "id": "meu-plano",
      "titulo": "Meu planejamento",
      "categoria": "Organização",
      "resumo": "Resumo para encontrar o documento.",
      "caminho": "/caminho/local/planejamento.md"
    }
  ],
  "diretorio": "/caminho/local/diretorio.csv"
}
```

O diretório é opcional e usa CSV com cabeçalho e ponto e vírgula. Cada linha
precisa de `codigo` único; os nomes de campo usam letras minúsculas e
underscore. O script recusa saída em `public/` e exige que uma saída dentro do
repositório seja ignorada pelo Git.

```sh
python3 tools/acao/preparar.py /caminho/manifesto.json .local/pacote-acao.json
```

Na central, o dono usa **Adicionar / atualizar** para importar o pacote JSON ou
arquivos Markdown. Um pacote substitui o acervo de documentos e o diretório;
upload de Markdown atualiza os arquivos correspondentes e mantém os demais.
Os limites são 40 documentos, 1 MB por documento, 5 MB de pacote e mil destinos.
A validação é integral antes da gravação.

Nenhum texto privado deve ser colocado em `src/`, em arquivos estáticos de
`public/` ou no repositório de origem. Downloads locais são lidos somente pelo
preparador, fora da geração estática.

## Marcações e cópias

Tarefas Markdown recebem identidade pelo documento, texto e ocorrência. Mover
uma tarefa sem mudar o texto preserva a marcação. Exemplos em blocos de código
ficam fora dos checklists. Reimportações mantêm as marcações das tarefas que
continuam no acervo.

POST exige o dono, origem válida e CSRF; gravações usam `com_trava()` e
`gravar_atomico()`. A cópia privada para download reúne o acervo e o progresso
em ZIP; a restauração é feita na pasta privada de dados da hospedagem.
O backup operacional geral exclui esses dois arquivos, pois também pode ser
baixado por outros administradores.

## Verificação

- `testes/acoes/acao.test.ts`: acesso anônimo e de outros administradores,
  retorno de login, CSRF, origem, marcações concorrentes, reimportação e cópias.
- `testes/contrato/acao.test.ts`: página oculta, regras de URL, sumário e busca.
- Depois do build, conferir que os textos privados não aparecem em HTML,
  JavaScript ou payloads estáticos. A importação no servidor acontece após o
  deploy do código e exige uma sessão real do dono.
