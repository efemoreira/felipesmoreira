# Painel — felipesmoreira.com/painel

Painel administrativo do site. Roda no PHP da Hostinger, ao lado do site estático
gerado pelo Next. Duas funcionalidades hoje: **Agenda da semana** e **Estúdio de
artes**.

> Este arquivo mora em `docs/` de propósito: nada em `public/` fica fora do ar,
> e explicar o mecanismo de recuperação numa URL pública não ajuda ninguém.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `public/painel/sessao.php` | Núcleo: sessão, usuários, permissões. Todos os outros começam por aqui. |
| `public/painel/layout.php` | Cabeçalho, menu e rodapé compartilhados. |
| `public/painel/index.php` | Login, criação do primeiro admin e hub das áreas. |
| `public/painel/agenda.php` | Editor da programação da semana. |
| `public/painel/estudio.php` | Porteiro do estúdio (serve o `estudio.html` do build). |
| `public/painel/usuarios.php` | Gestão de usuários — só admin. |
| `public/painel/conta.php` | Cada um troca a própria senha. |
| `public/painel/painel.css` | Visual das telas. |

## Onde ficam os dados

Tudo em `public_html/dados/`, **fora do repositório** — um deploy novo nunca
apaga o que foi editado no painel:

- `usuarios.php` — os usuários, com a senha em hash bcrypt.
- `agenda.json` — a agenda que a página `/programacao` lê.
- `imagens/` — as fotos enviadas nos itens da agenda.
- `backups/` — as 12 últimas versões da agenda.
- `tentativas.json` — contador de tentativas de login, por login.

O `.htaccess` dessa pasta bloqueia o download de qualquer `.php`, então os hashes
não saem pela web. O `agenda.json` continua legível, porque a página precisa dele.

Se existir um `dados/config.php` do painel antigo (senha única, sem usuários),
ele é **ignorado** e pode ser apagado.

## Primeiro acesso

Assim que o deploy subir, abra `felipesmoreira.com/painel/`. Como ainda não existe
nenhum usuário, a tela oferece **criar o primeiro administrador**.

> **Faça isso na hora.** Enquanto não existir nenhum usuário, quem chegar em
> `/painel/` pode criar o administrador. A janela é curta, mas é real.

Depois disso a tela vira o login normal e o cadastro de novos usuários só sai
pelo `usuarios.php`.

## Papéis e áreas

- **Administrador** — abre todas as áreas, marcadas ou não, e é o único que
  gerencia usuários. O painel não deixa ficar sem nenhum admin ativo: não dá para
  se rebaixar, se desativar nem remover o último.
- **Editor** — abre só as áreas marcadas (Agenda, Estúdio). Sem marcação nenhuma,
  entra e vê um painel vazio.

Tirar uma permissão vale na hora: a sessão é conferida contra o disco a cada
requisição, não fica presa ao que valia no login.

## Senha esquecida

Só o hash é guardado. **Não existe descobrir a senha, existe trocar.**

1. **Se outra pessoa é admin** — ela abre `usuarios.php`, clica em *Resetar senha*
   do seu login e passa a senha provisória que aparece na tela. Essa senha só
   aparece uma vez, e quem entrar com ela é obrigado a trocar na hora.

2. **Se você é o único admin e esqueceu** — apague `public_html/dados/usuarios.php`
   pelo Gerenciador de Arquivos do hPanel. O painel volta à tela de primeiro
   acesso e você cria o administrador de novo.
   *Isso apaga todos os usuários* — os outros terão de ser recadastrados. A agenda
   e as imagens não são afetadas.

## Regras de senha

- Mínimo de 8 caracteres.
- 5 tentativas erradas travam **aquele login** por 15 minutos. Errar o seu não
  atrapalha o de mais ninguém.
- Sessão cai depois de 2 horas parada.
- Senha provisória é gerada pelo painel em blocos legíveis (`abcd-efgh-ijkl`,
  sem `l`, `o`, `0` ou `1`), para passar por telefone sem erro.

## URLs

O `.htaccess` gerado no workflow mapeia as URLs limpas:

```
/painel/            → index.php
/painel/agenda      → agenda.php
/painel/estudio     → estudio.php
/painel/usuarios    → usuarios.php
/painel/conta       → conta.php
```

O `estudio.html` gerado pelo Next fica bloqueado no `.htaccess` de `/painel`:
a única forma de recebê-lo é pelo `estudio.php`, depois da conferência de sessão.
