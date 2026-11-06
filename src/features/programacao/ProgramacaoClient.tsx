"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { C, FOCO, FONT_ALFA, LARGURA, PONTOS, RAIO, borda, sombra } from "@/lib/theme";
import Link from "next/link";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { sinal } from "@/lib/api/sinal";
import { Icon, IconName } from "@/components/icons";
import CompartilharClient from "./CompartilharClient";
import DetalheEncontro from "./DetalheEncontro";
import {
  sigla,
  NOMES_FAMILIA,
  type Agenda,
  type Familia,
  type ItemAgenda,
  vouDoItem,
} from "./tipos";
import { CAMINHO_AGENDA_AO_VIVO, normalizarAgenda } from "./dados";
import {
  comecoDaSemana,
  dentroDoPeriodo,
  emOrdem,
  estadoDe,
  estaAoVivo,
  idEmDestaque,
  janelaDoRecorte,
  periodoDoRecorte,
  quantosPassaram,
  soFuturos,
  type Estado,
  type Recorte,
} from "./tempo";

/* Ícones aceitos no JSON — evita quebrar a página com um nome inválido */
const ICONES_VALIDOS: IconName[] = [
  "youtube",
  "instagram",
  "twitch",
  "kick",
  "tiktok",
  "x",
  "video",
  "whatsapp",
  "play",
  "broadcast",
  "star",
];

const iconeSeguro = (nome: string | undefined, padrao: IconName): IconName =>
  nome && (ICONES_VALIDOS as string[]).includes(nome) ? (nome as IconName) : padrao;

/**
 * O que a página diz quando o recorte não sobrou nada.
 *
 * São quatro silêncios diferentes, e dizer a mesma frase nos quatro mandaria a
 * pessoa para um botão que também está vazio. Agora que o que já passou sai da
 * lista, "nada marcado" quase sempre quer dizer "já aconteceu" — e é isso que
 * precisa estar escrito, senão a página parece quebrada.
 */
const recadoDeVazio = (quantosPublicados: number, recorte: Recorte): string => {
  if (quantosPublicados === 0) return "A agenda desta semana ainda está sendo fechada. Volte já já.";
  if (recorte === "tudo") return "Nada mais marcado por enquanto. A próxima semana sai já já.";
  if (recorte === "hoje") return "Nada mais marcado para hoje. Toque em “Esta semana” para ver o resto.";
  if (recorte === "proxima") return "A próxima semana ainda está sendo fechada. Toque em “Tudo” para ver o que já está marcado.";
  return "Nada mais marcado para esta semana. Toque em “Tudo” para ver o que vem depois.";
};

const ProgramacaoClient: React.FC<{ semente: Agenda }> = ({ semente }) => {
  /* A semente vem do build (bom para SEO e para o primeiro paint). Se o painel
     tiver publicado uma agenda mais nova, ela substitui isto ao carregar. */
  const [agenda, setAgenda] = useState<Agenda>(semente);

  useEffect(() => {
    let ativo = true;
    fetch(`${CAMINHO_AGENDA_AO_VIVO}?v=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const viva = normalizarAgenda(json);
        if (ativo && viva) setAgenda(viva);
      })
      .catch(() => {
        /* sem painel publicado (ou offline): mantém o conteúdo do build */
      });
    return () => {
      ativo = false;
    };
  }, []);

  /* O relógio é lido no navegador, nunca no build: num export estático a hora
     de compilar congelaria, e a página diria "é o próximo" sobre um evento de
     três semanas atrás. Começa em null para o HTML gerado e o primeiro render
     do cliente desenharem igual — depois o efeito acorda o relógio. */
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    setAgora(new Date());
    /* Uma batida por minuto: é o que faz o selo "ao vivo" acender e apagar com
       a página aberta, sem ninguém precisar recarregar. */
    const t = window.setInterval(() => setAgora(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const todos = useMemo(() => agenda.programacao ?? [], [agenda]);

  /**
   * O RECORTE DE PERÍODO — "esta semana" por padrão.
   *
   * A página se chama Programação da Semana e mostrava tudo o que o painel
   * publicou, inclusive encontro de três semanas atrás (só mais apagado). Quem
   * abre no domingo à noite quer saber o que vem, não o que passou em julho.
   *
   * Começa em `semana` porque é o que o título promete; "hoje" é para quem já
   * sabe que vai sair de casa, "próxima semana" é para quem está se
   * organizando, e "tudo" continua a um toque para quem procura um encontro
   * específico.
   *
   * Onde a semana abre (domingo ou segunda) é escolha da capa, no painel —
   * `comecoDaSemana()` lê do mesmo `agenda.json`, então o recorte daqui e o
   * do painel são a mesma semana.
   */
  const [recorte, setRecorte] = useState<Recorte>("semana");
  const comeco = comecoDaSemana(agenda);

  /* ANTES DO RELÓGIO ACORDAR, MOSTRA TUDO. O HTML do build e o primeiro render
     do cliente precisam sair iguais — recortar por uma data no servidor
     congelaria a semana da compilação dentro do HTML estático. */
  const janela = useMemo(
    () => (agora ? janelaDoRecorte(recorte, agora, comeco) : null),
    [recorte, agora, comeco],
  );

  const noRecorte = useMemo(
    () => (janela ? todos.filter((i) => dentroDoPeriodo(i, janela)) : todos),
    [todos, janela],
  );

  /* E, dentro do recorte, SÓ O QUE AINDA VAI ACONTECER — inclusive em "tudo".
     O evento que já passou não é agenda: quem abre a página quer saber o que
     vem. Ele continua inteiro no painel, que é onde a coordenação o procura.
     (É o mesmo par janela + `soFuturos()` de `itensDoRecorte()`, que o pôster
     usa; aqui fica em dois passos porque o rodapé conta os `passados` do
     recorte, e para isso precisa ver a lista antes do corte.) */
  const futuros = useMemo(
    () => (agora ? soFuturos(noRecorte, agora) : noRecorte),
    [noRecorte, agora],
  );

  /**
   * O FILTRO DE CATEGORIA — militância, público, ato de campanha, relacional...
   *
   * Só aparece quando o recorte atual tem mais de uma família: numa semana só
   * de militância, oferecer o filtro seria oferecer cinco botões vazios ao
   * lado do único que faz algo.
   */
  const familiasPresentes = useMemo(
    () =>
      (Object.keys(NOMES_FAMILIA) as Familia[]).filter((f) => futuros.some((i) => i.familia === f)),
    [futuros],
  );
  const [familia, setFamilia] = useState<Familia | "todas">("todas");
  useEffect(() => {
    if (familia !== "todas" && !familiasPresentes.includes(familia)) {
      setFamilia("todas");
    }
  }, [familiasPresentes, familia]);
  /**
   * ONDE E COMO — cidade e formato (plano 2026–2027: "agenda com filtros").
   *
   * A cidade só oferece as que têm alguma atividade no recorte. Escolher uma
   * cidade não esconde o que é on-line: a live serve para quem está em
   * Caucaia também. Quem quer só o presencial aperta "Presencial".
   *
   * Os dois moram na URL (`?cidade=Caucaia&formato=online`), para o link
   * filtrado poder ir para o grupo do núcleo.
   */
  const cidadesPresentes = useMemo(
    () => [...new Set(futuros.map((i) => i.cidade ?? "").filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [futuros],
  );
  const temOnline = futuros.some((i) => i.formato === "online");
  const temPresencial = futuros.some((i) => i.formato !== "online");
  const [cidade, setCidade] = useState("");
  const [formato, setFormato] = useState<"" | "presencial" | "online">("");
  const leuUrl = useRef(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setCidade(q.get("cidade") ?? "");
    const f = q.get("formato");
    if (f === "online" || f === "presencial") setFormato(f);
    leuUrl.current = true;
  }, []);
  useEffect(() => {
    if (!leuUrl.current) return;
    const q = new URLSearchParams(window.location.search);
    if (cidade) q.set("cidade", cidade);
    else q.delete("cidade");
    if (formato) q.set("formato", formato);
    else q.delete("formato");
    const s = q.toString();
    window.history.replaceState(null, "", window.location.pathname + (s ? `?${s}` : "") + window.location.hash);
  }, [cidade, formato]);

  const itens = useMemo(
    () =>
      futuros.filter(
        (i) =>
          (familia === "todas" || i.familia === familia) &&
          (formato === "" || (formato === "online" ? i.formato === "online" : i.formato !== "online")) &&
          (cidade === "" || i.cidade === cidade || i.formato === "online"),
      ),
    [futuros, familia, cidade, formato],
  );

  /**
   * O cartão de evento para o buscador.
   *
   * Esteve bloqueado desde o começo pela mesma falta que causava o "ao vivo"
   * fantasma: sem data de verdade não há `startDate`, e emitir data adivinhada
   * seria pior que não emitir. Agora que o painel guarda o instante, dá.
   *
   * Sai do lado do cliente porque **a agenda de verdade também sai**: o HTML do
   * build carrega a semente, que envelhece. O Google executa o JavaScript ao
   * indexar, então ele lê a agenda publicada — e só entram os eventos que têm
   * horário e ainda não passaram.
   */
  const schemaEventos = useMemo(() => {
    if (!agora) return null;
    /* `todos`, e não o recorte: o que o buscador indexa não pode depender do
       botão que a pessoa apertou na tela. */
    const futuros = todos.filter(
      (i) => i.inicio && estadoDe(i, agora) !== "passado" && estadoDe(i, agora) !== "sem-horario",
    );
    if (futuros.length === 0) return null;

    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: futuros.map((i, n) => ({
        "@type": "ListItem",
        position: n + 1,
        item: {
          "@type": "Event",
          name: i.titulo,
          description: i.subtitulo || undefined,
          startDate: i.inicio,
          eventStatus: "https://schema.org/EventScheduled",
          /* Com lugar é encontro de rua; sem, é transmissão. */
          eventAttendanceMode: i.local
            ? "https://schema.org/OfflineEventAttendanceMode"
            : "https://schema.org/OnlineEventAttendanceMode",
          location: i.local
            ? { "@type": "Place", name: i.local }
            : {
                "@type": "VirtualLocation",
                url: i.link || "https://felipesmoreira.com/programacao",
              },
          organizer: { "@type": "Organization", name: "Missão Ceará" },
        },
      })),
    });
  }, [todos, agora]);
  const ordenados = useMemo(() => emOrdem(itens, agora ?? undefined), [itens, agora]);
  const destaque = useMemo(() => (agora ? idEmDestaque(itens, agora) : null), [itens, agora]);
  /* Quantos o recorte tinha e a lista deixou de fora por já terem acontecido —
     contados na mesma janela que a lista, para o rodapé não falar de outra. */
  const passados = agora ? quantosPassaram(noRecorte, agora) : 0;

  /**
   * A FICHA ABERTA — o encontro cujo cartão foi tocado.
   *
   * Guarda o id, e não o item: a agenda ao vivo pode chegar com o cartão já
   * aberto, e a ficha tem de mostrar o que está publicado agora. Se o encontro
   * sair da lista (passou, o recorte mudou), a ficha fecha sozinha. O foco
   * volta para o cartão que a abriu, como no modal de compartilhar.
   */
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const origemRef = useRef<HTMLElement | null>(null);
  /* CADA ATIVIDADE TEM ENDEREÇO: `/programacao#a-<id>`. Abrir a ficha põe o
     endereço na barra (é o que se copia e manda no grupo), e chegar por ele
     abre a ficha direto. O sinal conta quem chegou às atividades — o primeiro
     indicador do site no plano. */
  const abrir = useCallback((item: ItemAgenda, origem: HTMLElement) => {
    origemRef.current = origem;
    setAbertoId(item.id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#a-${item.id}`);
    sinal("abriu-atividade");
  }, []);
  const fechar = useCallback(() => {
    setAbertoId(null);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    origemRef.current?.focus();
    origemRef.current = null;
  }, []);
  useEffect(() => {
    const doEndereco = () => {
      const m = window.location.hash.match(/^#a-([a-z0-9-]+)$/i);
      if (m) {
        setAbertoId(m[1]);
        sinal("abriu-atividade");
      }
    };
    doEndereco();
    window.addEventListener("hashchange", doEndereco);
    return () => window.removeEventListener("hashchange", doEndereco);
  }, []);
  /* Pelo endereço, a atividade abre mesmo fora do recorte ou do filtro. */
  const aberto = abertoId ? ordenados.find((i) => i.id === abertoId) ?? todos.find((i) => i.id === abertoId) ?? null : null;

  return (
    <PaginaDoSite
      fundo="livre"
      abertura={
        <AberturaPagina
          trilha="Agenda"
          kicker={(agora ? periodoDoRecorte(agenda, recorte, agora) : agenda.periodo) || undefined}
          titulo={agenda.titulo}
          icone="calendar"
          intro={agenda.chamada ? <p>{agenda.chamada}</p> : undefined}
        />
      }
    >
    <div className="s-largura ag-miolo">
      {schemaEventos && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaEventos }} />
      )}

      {/* ===== Os filtros, numa faixa só: quando, o quê, onde ===== */}
      <div className="ag-filtros">
        {/* ===== O recorte de período =====
            Só depois de o relógio acordar: sem ele os três botões não teriam o
            que recortar, e o HTML do build sairia com um estado marcado que o
            primeiro render do cliente contradiria. */}
        {agora && todos.length > 0 && (
          <div className="ag-recorte" role="group" aria-label="Período">
            {(
              [
                ["hoje", "Hoje"],
                ["semana", "Esta semana"],
                ["proxima", "Próxima semana"],
                ["tudo", "Tudo"],
              ] as const
            ).map(([chave, rotulo]) => (
              <button
                key={chave}
                type="button"
                className={recorte === chave ? "ag-recorte-on" : undefined}
                aria-pressed={recorte === chave}
                onClick={() => setRecorte(chave)}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}

        {/* ===== O filtro de categoria =====
            Só quando o recorte atual tem mais de uma família — um só botão
            marcado sozinho não é filtro, é decoração. */}
        {agora && familiasPresentes.length > 1 && (
          <div className="ag-recorte ag-recorte-leve" role="group" aria-label="Categoria">
            <button
              type="button"
              className={familia === "todas" ? "ag-recorte-on" : undefined}
              aria-pressed={familia === "todas"}
              onClick={() => setFamilia("todas")}
            >
              Todas
            </button>
            {familiasPresentes.map((f) => (
              <button
                key={f}
                type="button"
                className={familia === f ? "ag-recorte-on" : undefined}
                aria-pressed={familia === f}
                onClick={() => setFamilia(f)}
              >
                {NOMES_FAMILIA[f]}
              </button>
            ))}
          </div>
        )}

        {/* ===== Onde e como ===== */}
        {agora && (cidadesPresentes.length > 0 || (temOnline && temPresencial)) && (
          <div className="ag-onde">
            {cidadesPresentes.length > 0 && (
              <label className="ag-cidade">
                <span>Cidade</span>
                <select value={cidade} onChange={(e) => setCidade(e.target.value)}>
                  <option value="">Todas as cidades</option>
                  {cidadesPresentes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            {temOnline && temPresencial && (
              <div className="ag-recorte ag-recorte-leve" role="group" aria-label="Formato">
                {([["", "Tudo"], ["presencial", "Presencial"], ["online", "On-line"]] as const).map(([v, r]) => (
                  <button key={v} type="button" className={formato === v ? "ag-recorte-on" : undefined} aria-pressed={formato === v} onClick={() => setFormato(v)}>
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

        {/* ===== Lista da programação ===== */}
        {itens.length === 0 ? (
          <div className="ag-vazio">
            <p>{recadoDeVazio(todos.length, recorte)}</p>
            {/* Sem nada publicado, a página não pode ser um beco: o canal de
                sempre e o convite, que é o que todas as rotas oferecem. */}
            {todos.length === 0 && (
              <p className="ag-vazio-acoes">
                {agenda.disponivelEm?.[0] && (
                  <a className="s-btn s-btn-linha s-btn-peq" href={agenda.disponivelEm[0].url} target="_blank" rel="noopener noreferrer">
                    Ver o canal no {agenda.disponivelEm[0].nome}
                  </a>
                )}
                <Link className="s-btn s-btn-ouro s-btn-peq" href="/queroajudar" prefetch={false}>
                  Quero ajudar
                </Link>
              </p>
            )}
          </div>
        ) : (
          <ol className="ag-lista">
            {ordenados.map((item, i) => (
              <li key={item.id ?? i} className="ag-item">
                <Cartao
                  item={item}
                  estado={agora ? estadoDe(item, agora) : "sem-horario"}
                  destaque={item.id === destaque}
                  aoVivoAgora={agora ? estaAoVivo(item, agora) : false}
                  onAbrir={abrir}
                />
                {/* O botão de confirmar fica FORA do cartão, e não dentro: o cartão inteiro
                    é o botão que abre a ficha, e botão dentro de botão é
                    interativo aninhado — HTML inválido, e no leitor de tela os
                    dois viram um alvo só.

                    Reta final da eleição: UM botão só, não dois — "Confirmar
                    presença" e "Quero ajudar" competindo no mesmo cartão custava
                    mais decisão do que o momento permite. Para onde ele vai é
                    decisão da família do encontro, e quem decide é `vouDoItem()`
                    — ato de campanha entra direto no grupo, o resto passa pelo
                    formulário de confirmação (que oferece o grupo no fim). Só
                    aparece em encontro presencial futuro; quem decide é o
                    painel, ao gerar o agenda.json. */}
                {(() => {
                  const vou = vouDoItem(item);
                  if (!vou) return null;
                  return (
                    <a
                      className="s-btn s-btn-ouro s-btn-peq ag-vou"
                      href={vou.href}
                      {...(vou.grupo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {vou.grupo && <Icon name="whatsapp" size={18} />}
                      {/* A mesma palavra da tela para onde ele leva: quem toca
                          aqui sabe o que vai acontecer antes de a página abrir. */}
                      <span>{vou.rotulo}</span>
                    </a>
                  );
                })()}
              </li>
            ))}
          </ol>
        )}

        {/* O CONVITE PARA QUEM QUER AJUDAR NA ORGANIZAÇÃO. Só quando a capa
            tem o link do grupo: a página não promete porta que não existe. Fica
            depois da lista, e não no cabeçalho — quem lê a agenda inteira e
            chega aqui é quem já se interessou o bastante para entrar. */}
        {agenda.grupo && (
          <aside className="ag-grupo" aria-label="Ajudar na organização">
            <p className="ag-grupo-texto">
              <strong>Quer ajudar na organização?</strong> Quem monta os encontros
              combina tudo num grupo — entre e diga em que pode ajudar.
            </p>
            <a className="s-btn s-btn-ouro s-btn-peq" href={agenda.grupo} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} />
              <span>Entrar no grupo</span>
            </a>
          </aside>
        )}

        <footer className="ag-rodape">
          {/* Gera o PNG da agenda no próprio navegador — com o recorte que
              está apertado: o que se vê é o que se compartilha. */}
          <CompartilharClient agenda={agenda} recorte={recorte} />
          {agenda.disponivelEm && agenda.disponivelEm.length > 0 && (
            <div className="ag-canais">
              <span>Acompanhe em</span>
              <nav aria-label="Onde assistir" className="ag-canais-lista">
                {agenda.disponivelEm.map((c) => (
                  <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer" aria-label={`Assistir no ${c.nome}`} title={`Assistir no ${c.nome}`} className="ag-canal">
                    <Icon name={iconeSeguro(c.icone, "play")} size={20} />
                  </a>
                ))}
              </nav>
            </div>
          )}
          {passados > 0 && (
            <p>
              {passados === 1
                ? "1 evento deste período já aconteceu e saiu da lista."
                : `${passados} eventos deste período já aconteceram e saíram da lista.`}
            </p>
          )}
          <p>
            Horários de Brasília. Pode mudar de última hora: confirme nos
            perfis <strong>@moreiramissao</strong>.
          </p>
        </footer>

      {aberto && (
        <DetalheEncontro
          item={aberto}
          estado={agora ? estadoDe(aberto, agora) : "sem-horario"}
          aoVivoAgora={agora ? estaAoVivo(aberto, agora) : false}
          onFechar={fechar}
        />
      )}

      <style>{css}</style>
    </div>
    </PaginaDoSite>
  );
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/* ===== Cartão de um dia da programação ===== */
const Cartao: React.FC<{
  item: ItemAgenda;
  estado: Estado;
  destaque: boolean;
  aoVivoAgora: boolean;
  onAbrir: (item: ItemAgenda, origem: HTMLElement) => void;
}> = ({ item, estado, destaque, aoVivoAgora, onAbrir }) => {
  /* A etiqueta obedece o relógio: "Ao vivo" só enquanto está acontecendo, e o
     que já passou diz que passou em vez de fingir que ainda vem. */
  const etiqueta =
    aoVivoAgora ? "Ao vivo"
      : estado === "passado" ? "Já passou"
      /* Está na janela mas não é transmissão — um comício, uma reunião. Dizer
         "é o próximo" sobre algo que já começou é pior que não dizer nada. */
      : estado === "agora" ? "Acontecendo agora"
      : destaque ? "É o próximo"
      : item.etiqueta ?? null;

  const classe = `ag-cartao${estado === "passado" ? " ag-passou" : ""}`;
  const rotulo = `${item.dia}, ${item.data}${item.hora ? ` às ${item.hora}` : ""} — ${item.titulo}`;
  const [dd, mm] = item.data.split("/");
  const mes = MESES[Number(mm) - 1];
  const onde = item.local || (item.plataforma ? NOME_CANAL[item.plataforma] : "");

  /* O CARTÃO INTEIRO ABRE A FICHA: tudo o que a coordenação preencheu abre no
     modal, e o link vira um botão lá dentro.

     O botão é um filho esticado por cima do cartão, e não o cartão virado
     `<button>`: botão só aceita conteúdo de frase, e aqui há `<h2>`. O rótulo
     dele é a linha inteira — dia, data, hora e título — para o leitor de tela
     dizer o que vai abrir. */
  return (
    <article className={classe}>
      <button
        type="button"
        className="ag-abrir"
        aria-label={`Ver detalhes: ${rotulo}`}
        onClick={(e) => onAbrir(item, e.currentTarget)}
      />
      {/* A data é o que se procura primeiro numa agenda: ela abre o cartão. */}
      <div className="ag-data" aria-hidden="true">
        {mes ? (
          <>
            <strong>{dd}</strong>
            <span>{mes}</span>
          </>
        ) : (
          <strong className="ag-data-sigla">{sigla(item.dia)}</strong>
        )}
      </div>

      <div className="ag-texto">
        {etiqueta && (
          <p className={`ag-etiqueta${aoVivoAgora ? " ag-etiqueta-viva" : ""}`}>
            {aoVivoAgora && <span className="ag-ponto" aria-hidden="true" />}
            {etiqueta}
          </p>
        )}
        <h2 className="ag-item-titulo">{item.titulo}</h2>
        <p className="ag-item-quando">
          {item.dia}
          {item.hora && `, ${item.hora.toLowerCase()}`}
          {onde && ` · ${onde}`}
        </p>
        {item.subtitulo && item.subtitulo !== item.local && <p className="ag-item-sub">{item.subtitulo}</p>}
      </div>

      {item.imagem && (
        <div className="ag-thumb">
          <img src={item.imagem} alt="" loading="lazy" decoding="async" />
        </div>
      )}
    </article>
  );
};

/* O nome de cada canal, para a linha do cartão. */
const NOME_CANAL: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", twitch: "Twitch", kick: "Kick", tiktok: "TikTok", x: "X", video: "On-line", whatsapp: "WhatsApp", play: "On-line", broadcast: "Ao vivo" };

/* ===== estilos ===== */
const css = `
  .ag-miolo { padding-block: 12px clamp(48px, 7vw, 80px); }

  /* ---------- filtros ---------- */
  .ag-filtros { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
  .ag-recorte { display: flex; flex-wrap: wrap; gap: 6px; }
  .ag-recorte button {
    min-height: 44px; padding: 8px 16px; cursor: pointer; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.pilula}px;
    background: ${C.paper}; color: ${C.ink}; font-size: 16px; font-weight: 600; line-height: 1.2; transition: background-color .15s ease, border-color .15s ease;
  }
  .ag-recorte button:hover { border-color: ${C.ink}; }
  .ag-recorte .ag-recorte-on, .ag-recorte .ag-recorte-on:hover { background: ${C.gold}; border-color: ${C.gold}; font-weight: 700; }
  .ag-recorte-leve button { font-size: 15.5px; min-height: 40px; padding: 6px 14px; border-color: ${C.linha}; }
  .ag-recorte-leve .ag-recorte-on, .ag-recorte-leve .ag-recorte-on:hover { background: ${C.ouroClaro}; border-color: ${C.goldDim}; }
  .ag-onde { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .ag-cidade { display: inline-flex; align-items: center; gap: 8px; font-size: 15.5px; font-weight: 600; }
  .ag-cidade select { min-height: 44px; padding: 8px 12px; font-size: 16px; color: ${C.ink}; background: ${C.paper}; border: ${borda(C.linhaForte)}; border-radius: ${RAIO.p + 2}px; }
  .ag-recorte button:focus-visible, .ag-cidade select:focus-visible, .ag-canal:focus-visible { outline: ${FOCO}; outline-offset: 2px; }

  /* ---------- lista ---------- */
  .ag-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .ag-item { display: flex; flex-direction: column; background: ${C.paper}; border: ${borda()}; border-radius: ${RAIO.g}px; transition: border-color .16s ease, box-shadow .16s ease; }
  .ag-item:hover { border-color: ${C.linhaForte}; box-shadow: ${sombra("cartao")}; }
  .ag-cartao { position: relative; flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 16px; padding: 14px 16px; }
  .ag-passou { opacity: .6; }
  .ag-abrir { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; border-radius: ${RAIO.g}px; background: transparent; cursor: pointer; }
  .ag-abrir:focus-visible { outline: ${FOCO}; outline-offset: -3px; }
  .ag-data { flex: 0 0 auto; width: 68px; height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: ${RAIO.m}px; background: ${C.gold}; color: ${C.ink}; line-height: 1; }
  .ag-data strong { font-family: ${FONT_ALFA}; font-weight: 400; font-size: 30px; }
  .ag-data span { margin-top: 4px; font-size: 14.5px; font-weight: 700; }
  .ag-data .ag-data-sigla { font-size: 19px; }
  .ag-texto { flex: 1 1 auto; min-width: 0; }
  .ag-etiqueta { display: inline-flex; align-items: center; gap: 6px; margin: 0 0 3px; font-size: 14.5px; line-height: 1.3; font-weight: 700; color: ${C.goldDim}; }
  .ag-etiqueta-viva { color: ${C.aoVivo}; }
  .ag-ponto { width: 8px; height: 8px; border-radius: 50%; background: ${C.aoVivo}; animation: agPulse 1.6s ease-in-out infinite; }
  .ag-item-titulo { margin: 0; font-size: 19px; line-height: 1.3; font-weight: 800; letter-spacing: -.01em; overflow-wrap: anywhere; }
  .ag-item-quando { margin: 3px 0 0; font-size: 16px; line-height: 1.4; color: ${C.ink}; }
  .ag-item-sub { margin: 2px 0 0; font-size: 15.5px; line-height: 1.4; color: ${C.suave}; }
  .ag-thumb { flex: 0 0 auto; width: 132px; aspect-ratio: 4 / 3; overflow: hidden; border-radius: ${RAIO.p + 2}px; background: ${C.fundo}; }
  .ag-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .ag-vou { margin: 0 12px 12px; }

  /* ---------- vazio ---------- */
  .ag-vazio { padding: clamp(28px, 5vw, 44px) 20px; text-align: center; font-size: 18px; line-height: 1.5; color: ${C.suave}; background: ${C.fundo}; border-radius: ${RAIO.g}px; }
  .ag-vazio p { margin: 0; }
  .ag-vazio-acoes { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 18px !important; }

  /* ---------- convite do grupo ---------- */
  .ag-grupo { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 24px; padding: 18px 20px; background: ${C.ouroClaro}; border-radius: ${RAIO.g}px; }
  .ag-grupo-texto { margin: 0; flex: 1 1 260px; font-size: 16.5px; line-height: 1.5; }
  .ag-grupo-texto strong { display: block; margin-bottom: 2px; font-size: 18px; font-weight: 800; }

  /* ---------- rodapé da lista ---------- */
  .ag-rodape { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; max-width: ${LARGURA.texto}; margin-top: 28px; font-size: 15.5px; line-height: 1.5; color: ${C.suave}; }
  .ag-rodape p { margin: 0; }
  .ag-rodape strong { color: ${C.ink}; }
  .ag-canais { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-weight: 600; color: ${C.ink}; }
  .ag-canais-lista { display: flex; gap: 2px; }
  .ag-canal { width: 44px; height: 44px; display: grid; place-items: center; border-radius: ${RAIO.p + 2}px; color: ${C.ink}; }
  .ag-canal:hover { background: ${C.gold}; }

  @keyframes agPulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

  @media (min-width: ${PONTOS.tablet}px) {
    .ag-item { flex-direction: row; align-items: center; }
    .ag-cartao { padding: 16px 18px; }
    .ag-vou { flex: 0 0 auto; margin: 0 18px 0 0; }
    .ag-item-titulo { font-size: 20px; }
  }
  @media (max-width: ${PONTOS.tablet - 1}px) {
    .ag-thumb { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .ag-item, .ag-recorte button { transition: none; }
    .ag-ponto { animation: none; }
  }
`;

export default ProgramacaoClient;
