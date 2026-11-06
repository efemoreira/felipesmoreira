<?php
declare(strict_types=1);

/**
 * A porta — login, ou "criar o primeiro administrador" numa instalação nova.
 *
 * Enquanto não existir nenhuma conta E o arquivo de pessoas não existir,
 * qualquer visitante pode criar o administrador. As duas metades importam:
 * ver `index.php`.
 */

require_once __DIR__ . '/layout.php';

function tela_de_login(bool $primeiroAcesso, ?string $aviso, ?string $sucesso): void
{
        abrir_pagina($primeiroAcesso ? 'Criar administrador' : 'Entrar', false);
        ?>
        <div class="caixa">
        <?php if ($primeiroAcesso): ?>
          <h1>Criar administrador</h1>
          <p class="sub">
            Primeiro acesso: ainda não existe nenhum usuário. Quem for criado aqui
            entra como administrador e pode cadastrar o resto da equipe depois.
            As senhas ficam só na hospedagem, nunca no GitHub.
          </p>
          <?php recado($aviso, $sucesso); ?>
          <form method="post">
            <input type="hidden" name="acao" value="criar_admin">
            <div class="campo">
              <label for="nome">Nome</label>
              <input id="nome" type="text" name="nome" maxlength="60" required autofocus
                     value="<?= h($_POST['nome'] ?? '') ?>">
            </div>
            <div class="campo">
              <label for="usuario">Login</label>
              <input id="usuario" type="text" name="usuario" maxlength="24" required
                     autocomplete="username" value="<?= h($_POST['usuario'] ?? '') ?>">
              <p class="dica">Letras minúsculas, números, ponto, hífen ou _.</p>
            </div>
            <div class="campo">
              <label for="s1">Senha (mínimo <?= SENHA_MIN ?> caracteres)</label>
              <input id="s1" type="password" name="senha" autocomplete="new-password" required>
            </div>
            <div class="campo">
              <label for="s2">Repita a senha</label>
              <input id="s2" type="password" name="senha2" autocomplete="new-password" required>
            </div>
            <button class="btn btn-ouro" type="submit">Criar administrador</button>
          </form>
        <?php else: ?>
          <div class="caixa-selo" aria-hidden="true">
            <svg viewBox="-100 -100 200 200" focusable="false">
              <?php for ($i = 0; $i < 24; $i++): ?>
                <polygon points="<?= $i % 2 === 0 ? '-5.6,-60 5.6,-60 0,-98' : '-4.4,-60 4.4,-60 0,-84' ?>" transform="rotate(<?= $i * 15 ?>)" fill="#FFCB05"/>
              <?php endfor; ?>
            </svg>
            <img src="/image/icone-192.png" alt="" width="64" height="64">
          </div>
          <h1>Missão Ceará</h1>
          <p class="sub">
            A área de trabalho da militância. Entre com a senha que a coordenação
            mandou no seu WhatsApp.
          </p>
          <?php recado($aviso, $sucesso); ?>
          <form method="post">
            <input type="hidden" name="acao" value="entrar">
            <div class="campo">
              <label for="usuario">Seu usuário ou e-mail</label>
              <?php /* `maxlength` de 120, e não os 24 do login: e-mail é mais
                       comprido que isso, e caixa que corta o que a pessoa digitou
                       recusa a senha certa sem dizer por quê.

                       `type="text"` e não `type="email"`: o campo aceita as duas
                       coisas, e a validação do navegador reprovaria o login. */ ?>
              <input id="usuario" type="text" name="usuario" maxlength="120" required autofocus
                     autocomplete="username" autocapitalize="none" spellcheck="false"
                     value="<?= h($_POST['usuario'] ?? '') ?>">
              <p class="dica">Tanto faz: o usuário que a coordenação mandou ou o seu e-mail.</p>
            </div>
            <div class="campo">
              <label for="senha">Sua senha</label>
              <input id="senha" type="password" name="senha" autocomplete="current-password" required>
            </div>
            <button class="btn btn-ouro" type="submit">Entrar</button>
          </form>
          <p class="dica" style="margin-top:20px">
            Esqueceu a senha ou ainda não tem acesso? Fale com a coordenação no
            <a href="<?= h(WHATSAPP_COORDENACAO) ?>" target="_blank" rel="noopener">WhatsApp</a>.
          </p>
        <?php endif; ?>
        </div>
        <?php
        fechar_pagina();
}
