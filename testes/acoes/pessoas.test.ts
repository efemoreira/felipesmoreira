import { test, describe, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { montarSandbox, ADMIN, type Sandbox } from "../sandbox.ts";

/**
 * AÇÃO: a ficha de pessoa — cadastrar, dar conta, juntar duplicata, apagar.
 *
 * Nada aqui é reversível de graça, e as travas são todas do mesmo tipo: elas
 * impedem um clique de destruir o que ninguém consegue reconstruir depois.
 *
 * - **Juntar não sobrescreve o que já está preenchido**: quem escolheu manter
 *   aquela ficha decidiu que ela é a boa.
 * - **Duas contas de painel nunca se fundem**: qual login sobrevive não é
 *   decisão que se toma por inferência.
 * - **O último administrador não se apaga nem se rebaixa**: fazer isso tranca
 *   todo mundo para fora de criar conta e mexer em permissão.
 */

let painel: Sandbox;
before(() => {
  painel = montarSandbox();
});
beforeEach(() => painel.ressemear());
after(() => painel.fechar());

const MARIA = "pes00000000teste";

describe("ação: cadastrar e corrigir pessoa", () => {
  test("cadastra, e a cidade sai do catálogo e não do que foi digitado", async () => {
    const r = await painel.postar("pessoas", {
      acao: "salvar",
      nome: "João Pedro de Sousa",
      tipo: "militante",
      telefone: "(85) 98888-7777",
      cidade: "Juazeiro do Norte",
      bairro: "Centro",
    });

    assert.equal(r.status, 302);
    const joao = painel.ler("pessoas").find((p) => p.nome === "João Pedro de Sousa");
    assert.ok(joao, "não gravou");
    assert.equal(joao.cidade, "Juazeiro do Norte");
    assert.match(r.location, new RegExp(`\\?p=${joao.id}$`), "a ficha nova tem de abrir depois");
  });

  test("cidade inventada não entra na ficha", async () => {
    await painel.postar("pessoas", {
      acao: "salvar",
      nome: "Alguém de Marte",
      tipo: "eleitor",
      cidade: "Cidade Que Não Existe",
    });

    const p = painel.ler("pessoas").find((x) => x.nome === "Alguém de Marte");
    assert.notEqual(p.cidade, "Cidade Que Não Existe");
  });

  test("sem nome não cadastra — é o mínimo para chamar alguém de alguma coisa", async () => {
    const antes = painel.ler("pessoas").length;
    const r = await painel.postar("pessoas", { acao: "salvar", nome: "   ", tipo: "eleitor" });

    assert.match(r.html, /nome é o mínimo/i);
    assert.equal(painel.ler("pessoas").length, antes);
  });

  test("corrigir a ficha não cria uma segunda", async () => {
    const antes = painel.ler("pessoas").length;
    await painel.postar("pessoas", {
      acao: "salvar",
      id: MARIA,
      nome: "Maria da Silva Sauro",
      tipo: "militante",
      telefone: "85999990000",
      cidade: "Fortaleza",
      bairro: "Parangaba",
    });

    assert.equal(painel.ler("pessoas").length, antes);
    assert.equal(painel.ler("pessoas").find((p) => p.id === MARIA).bairro, "Parangaba");
  });
});

describe("ação: dar conta do painel", () => {
  test("cria o login com senha provisória de verdade", async () => {
    const r = await painel.postar("pessoas", { acao: "dar-conta", id: MARIA, usuario: "maria" });

    const maria = painel.ler("pessoas").find((p) => p.id === MARIA);
    assert.equal(maria.usuario, "maria");
    assert.equal(maria.trocarSenha, true, "sem isso a provisória vira definitiva");
    assert.equal(maria.status, "aprovada", "dar conta a quem estava pendente aprova junto");
    assert.match(r.html, /Conta criada/);
  });

  test("login com arroba é recusado — texto com arroba nunca é login", async () => {
    const r = await painel.postar("pessoas", {
      acao: "dar-conta",
      id: MARIA,
      usuario: "maria@exemplo.com",
    });

    assert.equal(painel.ler("pessoas").find((p) => p.id === MARIA).usuario ?? "", "");
    assert.doesNotMatch(r.html, /Conta criada/);
  });

  test("login já em uso não abre uma segunda porta para a mesma chave", async () => {
    const r = await painel.postar("pessoas", { acao: "dar-conta", id: MARIA, usuario: "teste" });

    assert.match(r.html, /já está em uso/);
    assert.equal(painel.ler("pessoas").find((p) => p.id === MARIA).usuario ?? "", "");
  });
});

describe("ação: o último administrador", () => {
  test("não se rebaixa sozinho", async () => {
    const r = await painel.postar("pessoas", {
      acao: "salvar",
      id: ADMIN,
      nome: "Coordenação de Teste",
      tipo: "coordenador",
      capacidades: ["comunicacao"], // tirou o `adm`
    });

    assert.match(r.html, /único administrador/i);
    const eu = painel.ler("pessoas").find((p) => p.id === ADMIN);
    assert.ok(eu.capacidades.includes("adm"), "o painel ficou sem administrador nenhum");
  });

  test("não se apaga", async () => {
    const r = await painel.postar("pessoas", { acao: "apagar", id: ADMIN });

    assert.match(r.html, /único administrador/i);
    assert.ok(painel.ler("pessoas").some((p) => p.id === ADMIN));
  });

  test("não se desativa", async () => {
    const r = await painel.postar("pessoas", { acao: "ativar", id: ADMIN });

    assert.match(r.html, /único administrador/i);
    assert.equal(painel.ler("pessoas").find((p) => p.id === ADMIN).ativo, true);
  });
});

describe("ação: apagar pessoa", () => {
  test("as presenças dela vão junto", async () => {
    const r = await painel.postar("pessoas", { acao: "apagar", id: MARIA });

    assert.equal(painel.ler("pessoas").some((p) => p.id === MARIA), false);
    assert.equal(
      painel.ler("presencas").length,
      0,
      "presença de quem não existe mais é linha que só atrapalha a contagem",
    );
    assert.match(r.html, /apagada/);
  });
});

describe("ação: juntar duplicata", () => {
  /** Cadastra uma segunda ficha do mesmo telefone e devolve o id dela. */
  async function duplicar(campos: Record<string, string> = {}): Promise<string> {
    await painel.postar("pessoas", {
      acao: "salvar",
      nome: "Maria da Silva Sauro",
      tipo: "eleitor",
      telefone: "85999990000",
      ...campos,
    });
    const nova = painel
      .ler("pessoas")
      .filter((p) => p.nome === "Maria da Silva Sauro" && p.id !== MARIA);
    assert.equal(nova.length, 1, "a duplicata de apoio não foi criada");
    return nova[0].id;
  }

  test("o vazio de quem fica é preenchido, e o preenchido não é sobrescrito", async () => {
    const sumir = await duplicar({ email: "maria@exemplo.com", bairro: "Messejana" });

    const r = await painel.postar("pessoas", { acao: "juntar", id: MARIA, sumir });

    assert.match(r.html, /juntadas/i);
    const maria = painel.ler("pessoas").find((p) => p.id === MARIA);
    assert.equal(maria.email, "maria@exemplo.com", "o campo vazio tinha de ser preenchido");
    assert.equal(maria.bairro, "Benfica", "o campo preenchido foi sobrescrito");
    assert.equal(painel.ler("pessoas").some((p) => p.id === sumir), false);
  });

  test("as presenças mudam de dono em vez de sumir", async () => {
    const sumir = await duplicar();
    await painel.postar("pessoas", { acao: "juntar", id: sumir, sumir: MARIA });

    const presencas = painel.ler("presencas");
    assert.equal(presencas.length, 1, "a presença sumiu na fusão");
    assert.equal(presencas[0].pessoaId, sumir, "a presença não mudou de dono");
  });

  test("duas contas de painel nunca se fundem", async () => {
    const sumir = await duplicar();
    await painel.postar("pessoas", { acao: "dar-conta", id: MARIA, usuario: "maria" });
    await painel.postar("pessoas", { acao: "dar-conta", id: sumir, usuario: "maria2" });

    const r = await painel.postar("pessoas", { acao: "juntar", id: MARIA, sumir });

    assert.match(r.html, /Duas contas de painel nunca se fundem/);
    assert.ok(painel.ler("pessoas").some((p) => p.id === sumir), "uma das contas foi apagada");
  });
});

/**
 * QUEM ACOMPANHA QUEM.
 *
 * Oitenta e sete pessoas e um coordenador: a camada intermediária deixou de ser
 * melhoria e virou aritmética. O que este bloco prende é a regra de dado
 * pessoal que o campo `lider` poderia furar sem ninguém decidir isso.
 */
describe("pessoas: a camada de liderança", () => {
  /** Duas pessoas: uma sob a conta de teste, outra sob qualquer outro líder. */
  function comGente(lider = ADMIN) {
    painel.gravar("pessoas", [
      ...painel.ler("pessoas"),
      {
        id: "seg-1", nome: "Seguida Um", telefone: "85966660000",
        tipo: "militante", status: "aprovada", ativo: true, lider,
        criadoEm: "2026-01-03T10:00:00-03:00",
      },
      {
        id: "seg-2", nome: "De Outro Time", telefone: "85955550000",
        tipo: "militante", status: "aprovada", ativo: true, lider: "outro-qualquer",
        criadoEm: "2026-01-03T10:00:00-03:00",
      },
    ]);
  }

  test("o campo grava e a ficha aponta para quem acompanha", async () => {
    comGente();
    await painel.postar("pessoas", {
      acao: "salvar", id: "seg-1", nome: "Seguida Um", tipo: "militante", lider: ADMIN,
    });
    assert.equal(painel.ler("pessoas").find((p) => p.id === "seg-1")!.lider, ADMIN);
  });

  test("ninguém acompanha a si mesmo, nem por POST montado à mão", async () => {
    comGente();
    await painel.postar("pessoas", {
      acao: "salvar", id: "seg-1", nome: "Seguida Um", tipo: "militante", lider: "seg-1",
    });
    /* A pessoa sumiria da própria lista sem nunca aparecer na de outra. */
    assert.equal(painel.ler("pessoas").find((p) => p.id === "seg-1")!.lider, "");
  });

  test("quem lidera vê a própria gente — o Início conta, a tela lista, e só ela", async () => {
    comGente();
    const { html } = await painel.buscar("index");

    /* No Início fica o contador e a porta; a lista é /painel/gente. */
    const de = html.indexOf('id="minha-gente"');
    assert.ok(de > 0, "o cartão de quem você acompanha não foi desenhado");
    const bloco = html.slice(de, html.indexOf("</section>", de));
    assert.match(bloco, /Sua gente \(1\)/);
    assert.match(bloco, /href="\/painel\/gente\.php/, "o cartão não leva à tela");

    const tela = (await painel.buscar("gente")).html;
    assert.match(tela, /Seguida Um/);
    /* `pessoas` está só em `adm` de propósito: quem lidera acompanha gente, não
       recebe a agenda do movimento junto. */
    assert.doesNotMatch(tela, /De Outro Time/);
  });

  test("sem a capacidade, ter gente apontada não abre lista nenhuma", async () => {
    /* DUAS CHAVES: o campo `lider` organiza times; a capacidade decide quem vê
       dado pessoal. Se preencher o campo bastasse, a regra de `pessoas` estaria
       furada por efeito lateral de organizar um time. */
    comGente();
    painel.trocarCapacidades("eventos");
    const { html } = await painel.buscar("index");

    assert.match(html, /class="hub-lado"/, "não é o Início");
    assert.doesNotMatch(html, /Sua gente/);
  });

  test("a fusão de fichas preserva quem acompanha", async () => {
    comGente();
    painel.gravar("pessoas", [
      ...painel.ler("pessoas"),
      { id: "dup-1", nome: "Seguida Um", telefone: "85966660000",
        tipo: "militante", status: "", ativo: true, criadoEm: "2026-04-01T10:00:00-03:00" },
    ]);

    await painel.postar("pessoas", { acao: "juntar", id: "seg-1", sumir: "dup-1" });
    assert.equal(painel.ler("pessoas").find((p) => p.id === "seg-1")!.lider, ADMIN);
  });
});

describe("pessoas: o filtro de quem acompanha", () => {
  test("recorta por líder, e “ninguém ainda” acha quem ficou de fora", async () => {
    painel.gravar("pessoas", [
      ...painel.ler("pessoas"),
      { id: "com-lider", nome: "Tem Quem Chame", tipo: "militante", status: "aprovada",
        ativo: true, lider: ADMIN, criadoEm: "2026-01-03T10:00:00-03:00" },
      { id: "sem-ninguem", nome: "Ficou Sozinha", tipo: "militante", status: "aprovada",
        ativo: true, criadoEm: "2026-01-03T10:00:00-03:00" },
    ]);

    const sob = await painel.buscar("pessoas", `lider=${ADMIN}`);
    assert.match(sob.html, /Tem Quem Chame/);
    assert.doesNotMatch(sob.html, /Ficou Sozinha/);

    /* É o recorte que mais importa numa base grande: quem não está sob ninguém
       é quem some sem ninguém notar. */
    const sozinhas = await painel.buscar("pessoas", "lider=sem-lider");
    assert.match(sozinhas.html, /Ficou Sozinha/);
    assert.doesNotMatch(sozinhas.html, /Tem Quem Chame/);
  });
});

/**
 * AS REDES PROFISSIONAIS — o quarto eixo da ficha.
 *
 * `tipo` diz o que a pessoa É, `funcoes` o que ela FAZ, `capacidades` o que ela
 * ABRE. Faltava de que rede ela FAZ PARTE: um médico pode ser eleitor,
 * militante ou coordenador, e a rede não muda. É por ela que se monta a lista
 * curada de um encontro relacional — que o manual pede curta e por convite
 * pessoal, nunca por grupo.
 */
describe("pessoas: as redes profissionais", () => {
  test("grava só o que existe no catálogo", async () => {
    await painel.postar("pessoas", {
      acao: "salvar", nome: "Dra. Ana", tipo: "apoiador",
      "redes[]": ["medicos", "inventada"],
    });

    const nova = painel.ler("pessoas").find((p) => p.nome === "Dra. Ana")!;
    /* O arquivo é gravado por mais de uma tela: chave estranha não pode virar
       uma rede que nenhuma delas sabe desenhar. */
    assert.deepEqual(nova.redes, ["medicos"]);
  });

  test("o filtro devolve a lista curta daquela rede", async () => {
    painel.gravar("pessoas", [
      ...painel.ler("pessoas"),
      { id: "med-1", nome: "Doutora Saúde", tipo: "apoiador", status: "", ativo: true,
        redes: ["medicos"], criadoEm: "2026-01-03T10:00:00-03:00" },
      { id: "adv-1", nome: "Doutor Direito", tipo: "apoiador", status: "", ativo: true,
        redes: ["advogados"], criadoEm: "2026-01-03T10:00:00-03:00" },
    ]);

    const { html } = await painel.buscar("pessoas", "rede=medicos");
    assert.match(html, /Doutora Saúde/);
    assert.doesNotMatch(html, /Doutor Direito/);
  });

  test("a fusão de fichas soma as redes", async () => {
    painel.gravar("pessoas", [
      ...painel.ler("pessoas"),
      { id: "dupla-a", nome: "Dois Chapéus", telefone: "85944440000", tipo: "apoiador",
        status: "", ativo: true, redes: ["medicos"], criadoEm: "2026-01-03T10:00:00-03:00" },
      { id: "dupla-b", nome: "Dois Chapéus", telefone: "85944440000", tipo: "apoiador",
        status: "", ativo: true, redes: ["educacao"], criadoEm: "2026-04-03T10:00:00-03:00" },
    ]);

    await painel.postar("pessoas", { acao: "juntar", id: "dupla-a", sumir: "dupla-b" });
    /* Um advogado que também é professor não deixa de ser nenhum dos dois
       porque a ficha duplicada foi juntada. */
    const juntada = painel.ler("pessoas").find((p) => p.id === "dupla-a")!;
    assert.deepEqual([...juntada.redes].sort(), ["educacao", "medicos"]);
  });
});
