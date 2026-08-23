"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon, IconName } from "@/components/icons";
import CompartilharClient from "./CompartilharClient";
import { C, BORDA, sigla, temaDe, type Agenda, type ItemAgenda, sombra, sombraErguida, sombraAfundada } from "./tipos";
import { CAMINHO_AGENDA_AO_VIVO, normalizarAgenda } from "./dados";
import { emOrdem, estadoDe, estaAoVivo, idEmDestaque, quantosPassaram, type Estado } from "./tempo";

const FONT_ALFA = "var(--font-alfa), serif";
const FONT_ELITE = "var(--font-elite), monospace";
const FONT_BITTER = "var(--font-bitter), serif";

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

  const itens = useMemo(() => agenda.programacao ?? [], [agenda]);

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
    const futuros = itens.filter(
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
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location: {
            "@type": "VirtualLocation",
            url: i.link || "https://felipesmoreira.com/programacao",
          },
          performer: { "@type": "Person", name: "Felipe Moreira" },
          organizer: { "@type": "Organization", name: "Missão Ceará" },
        },
      })),
    });
  }, [itens, agora]);
  const ordenados = useMemo(() => emOrdem(itens, agora ?? undefined), [itens, agora]);
  const destaque = useMemo(() => (agora ? idEmDestaque(itens, agora) : null), [itens, agora]);
  const passados = agora ? quantosPassaram(itens, agora) : 0;

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: C.night }}>
      {schemaEventos && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaEventos }} />
      )}

      {/* ===== Fundo animado: cena do cordel ===== */}
      <iframe
        src="/cordel-bg.html#bg"
        title="Cena animada de cordel — sertão do Ceará com montanhas, mar e vida da caatinga"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(12,12,14,.72) 0%, rgba(12,12,14,.5) 40%, rgba(12,12,14,.78) 100%)",
        }}
      />

      <main
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 880,
          margin: "0 auto",
          padding: "28px 18px 56px",
          fontFamily: FONT_BITTER,
          color: C.cream,
        }}
      >
        {/* ===== Topo: voltar + onde assistir ===== */}
        <div className="ag-topo">
          <Link href="/" className="ag-voltar">
            <Icon name="arrowLeft" size={16} />
            <span>Voltar</span>
          </Link>

          {agenda.disponivelEm && agenda.disponivelEm.length > 0 && (
            <div className="ag-canais">
              <span className="ag-canais-label">Disponível em</span>
              <nav aria-label="Onde assistir" className="ag-canais-lista">
                {agenda.disponivelEm.map((c) => (
                  <a
                    key={c.nome}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Assistir no ${c.nome}`}
                    title={`Assistir no ${c.nome}`}
                    className="ag-canal"
                  >
                    <Icon name={iconeSeguro(c.icone, "play")} size={16} />
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* ===== Cabeçalho ===== */}
        <header className="ag-header">
          <h1 className="ag-titulo">
            <span className="ag-titulo-ouro">{primeiraPalavra(agenda.titulo)}</span>
            {restoDoTitulo(agenda.titulo) && (
              <span className="ag-titulo-claro"> {restoDoTitulo(agenda.titulo)}</span>
            )}
          </h1>

          {agenda.periodo && (
            <p className="ag-periodo">
              <Icon name="calendar" size={14} />
              <span>{agenda.periodo}</span>
            </p>
          )}

          {agenda.chamada && <p className="ag-chamada">{agenda.chamada}</p>}

          {/* Gera o PNG da agenda no próprio navegador */}
          <div className="ag-compartilhar">
            <CompartilharClient agenda={agenda} />
          </div>
        </header>

        {/* ===== Lista da programação ===== */}
        {itens.length === 0 ? (
          <p className="ag-vazio">
            A agenda desta semana ainda está sendo fechada. Volte já já.
          </p>
        ) : (
          <ol className="ag-lista">
            {ordenados.map((item, i) => (
              <li key={item.id ?? i} className="ag-item" style={{ "--i": i } as React.CSSProperties}>
                <Cartao
                  item={item}
                  estado={agora ? estadoDe(item, agora) : "sem-horario"}
                  destaque={item.id === destaque}
                  aoVivoAgora={agora ? estaAoVivo(item, agora) : false}
                />
                {/* O botão de confirmar fica FORA do cartão, e não dentro: o cartão inteiro já
                    é um link quando o item tem link, e botão dentro de link é
                    interativo aninhado — HTML inválido, e no leitor de tela os
                    dois viram um alvo só.

                    Só aparece em encontro presencial futuro; quem decide é o
                    painel, ao gerar o agenda.json. */}
                {item.confirmar && (
                  <a className="ag-vou" href={`/presenca?c=${item.confirmar}`}>
                    <Icon name="flag" size={15} />
                    {/* A mesma palavra da tela para onde ele leva, e a mesma que
                        o convite de qualquer evento usa: quem toca aqui sabe o
                        que vai acontecer antes de a página abrir. */}
                    <span>Confirmar presença</span>
                  </a>
                )}
              </li>
            ))}
          </ol>
        )}

        <footer className="ag-rodape">
          {passados > 0 && (
            <p>
              {passados === 1
                ? "1 evento desta semana já aconteceu e aparece mais apagado."
                : `${passados} eventos desta semana já aconteceram e aparecem mais apagados.`}
            </p>
          )}
          <p>
            Horários de Brasília · sujeito a mudança de última hora — confirme nos
            perfis <strong>@moreiramissao</strong>.
          </p>
        </footer>
      </main>

      <style>{css}</style>
    </div>
  );
};

/* ===== Cartão de um dia da programação ===== */
const Cartao: React.FC<{
  item: ItemAgenda;
  estado: Estado;
  destaque: boolean;
  aoVivoAgora: boolean;
}> = ({ item, estado, destaque, aoVivoAgora }) => {
  const tema = temaDe(item.cor);

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

  const vars = {
    "--bg": tema.bg,
    "--fg": tema.fg,
    "--sub": tema.sub,
    "--badge": tema.badge,
    "--badge-fg": tema.badgeFg,
  } as React.CSSProperties;

  const classe =
    `ag-cartao${tema.claro ? " ag-cartao-claro" : ""}` +
    `${estado === "passado" ? " ag-passou" : ""}` +
    `${destaque ? " ag-destaque" : ""}`;

  const conteudo = (
    <>
      {/* Miniatura — a primeira coluna do grid é dela, sempre.
          O cartão é `176px | 1fr | auto | auto` e a maioria dos eventos não tem
          imagem. Quando este bloco deixava de ser desenhado, os outros filhos
          escorregavam uma coluna: o título caía nos 176px (e quebrava em duas
          linhas) e a data, que se alinha à direita do `1fr`, ia parar do outro
          lado do cartão. Era esse o vão entre o título e a data — e some no
          celular, onde o cartão é de uma coluna só. */}
      <div className={`ag-thumb${item.imagem ? "" : " ag-thumb-reserva"}`}>
        {item.imagem ? (
          <img src={item.imagem} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="ag-reserva-sigla" aria-hidden="true">
            {sigla(item.dia)}
          </span>
        )}
        {etiqueta && (
          <span className="ag-etiqueta">
            {aoVivoAgora && <span className="ag-ponto" aria-hidden="true" />}
            {etiqueta}
          </span>
        )}
      </div>

      {/* Título + subtítulo */}
      <div className="ag-texto">
        <h2 className="ag-item-titulo">{item.titulo}</h2>
        {item.subtitulo && <p className="ag-item-sub">{item.subtitulo}</p>}
      </div>

      {/* Data / dia da semana */}
      <div className="ag-meta">
        <span className="ag-meta-data">
          {item.data}
          {item.hora && <span className="ag-meta-sep"> · </span>}
          {item.hora}
        </span>
        <span className="ag-meta-dia">{item.dia}</span>
      </div>

      {/* Selo da plataforma */}
      <span className="ag-selo" aria-hidden="true">
        <Icon name={iconeSeguro(item.plataforma, "play")} size={20} />
      </span>
    </>
  );

  const rotulo = `${item.dia}, ${item.data}${item.hora ? ` às ${item.hora}` : ""} — ${item.titulo}`;

  if (!item.link) {
    return (
      <article className={classe} style={vars} aria-label={rotulo}>
        {conteudo}
      </article>
    );
  }

  return item.interno ? (
    <Link href={item.link} className={`${classe} ag-clicavel`} style={vars} title={rotulo}>
      {conteudo}
    </Link>
  ) : (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${classe} ag-clicavel`}
      style={vars}
      title={rotulo}
    >
      {conteudo}
    </a>
  );
};

/* ===== utilidades de texto ===== */
const primeiraPalavra = (t: string) => t.split(" ")[0] ?? t;
const restoDoTitulo = (t: string) => t.split(" ").slice(1).join(" ");

/* ===== estilos ===== */
const css = `
  /* o botão de confirmar presença, abaixo do cartão */
  .ag-vou {
    display: inline-flex; align-items: center; gap: 7px;
    min-height: 44px; margin: 8px 0 0; padding: 0 16px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 1.6px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold2};
    border: ${BORDA}px solid ${C.ink}; box-shadow: ${sombra("rente", C.ink)};
    text-decoration: none;
  }
  .ag-vou:hover { background: ${C.gold}; }
  .ag-vou:active { transform: translate(2px, 2px); box-shadow: ${sombraAfundada("rente", C.ink)}; }

  .ag-topo {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap; margin-bottom: 26px;
  }
  .ag-voltar {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold}; text-decoration: none;
    padding: 11px 16px; min-height: 44px; border: 2px solid ${C.ink};
    box-shadow: ${sombra("rente")};
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .ag-voltar:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("rente")}; }
  .ag-voltar:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("rente")}; }

  .ag-canais { display: flex; align-items: center; gap: 10px; }
  .ag-canais-label {
    font-family: ${FONT_ELITE}; font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
    color: ${C.cream}; opacity: .8; text-shadow: 0 1px 6px rgba(0,0,0,.7);
  }
  .ag-canais-lista { display: flex; gap: 7px; }
  .ag-canal {
    width: 44px; height: 44px; display: grid; place-items: center;
    color: ${C.gold}; background: rgba(24,18,3,.85);
    border: 2px solid ${C.gold}; border-radius: 50%; text-decoration: none;
    transition: transform .12s ease, background .12s ease, color .12s ease;
  }
  .ag-canal:hover { background: ${C.gold}; color: ${C.ink}; transform: translateY(-2px); }

  .ag-header { text-align: center; margin-bottom: 30px; }
  .ag-titulo {
    font-family: ${FONT_ALFA};
    font-size: clamp(26px, 6.4vw, 44px);
    line-height: 1.06;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin: 0 0 12px;
    text-shadow: 3px 3px 0 ${C.ink}, 0 2px 18px rgba(0,0,0,.6);
  }
  .ag-titulo-ouro { color: ${C.gold}; }
  .ag-titulo-claro { color: ${C.cream}; }

  .ag-periodo {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2.5px; text-transform: uppercase;
    color: ${C.ink}; background: ${C.gold};
    padding: 4px 13px; margin: 0 0 12px;
    box-shadow: ${sombra("rente")};
  }
  .ag-chamada {
    max-width: 520px; margin: 0 auto;
    font-size: 15px; line-height: 1.5; color: ${C.cream};
    text-shadow: 0 1px 6px rgba(0,0,0,.7);
  }

  .ag-compartilhar { margin-top: 22px; }

  .ag-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
  .ag-item { animation: agIn .5s ease-out backwards; animation-delay: calc(.06s * var(--i, 0)); }

  .ag-cartao {
    display: grid;
    grid-template-columns: 176px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 18px;
    padding: 12px 14px 12px 12px;
    background: var(--bg);
    color: var(--fg);
    border: ${BORDA}px solid ${C.ink};
    box-shadow: ${sombra("alto")};
    text-decoration: none;
    transition: transform .14s ease, box-shadow .14s ease;
  }
  .ag-clicavel:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("alto")}; }
  .ag-clicavel:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("alto")}; }
  .ag-clicavel:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 4px; }

  .ag-thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: ${C.night};
    border: 2px solid ${C.ink};
  }
  .ag-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  /* Sem imagem — que é a maioria dos eventos: a hachura do cordel com a sigla
     do dia, o mesmo desenho que o pôster usa na linha do evento, para quem vê
     os dois reconhecer a mesma peça. Ela existe antes de tudo para **ocupar a
     coluna reservada**: cartão com a coluna vazia desmonta o grid. */
  .ag-thumb-reserva {
    display: grid; place-items: center;
    background:
      repeating-linear-gradient(135deg, rgba(255,203,5,.16) 0 8px, transparent 8px 16px),
      ${C.night};
  }
  .ag-reserva-sigla {
    font-family: ${FONT_ALFA}; font-size: clamp(20px, 2.6vw, 30px);
    letter-spacing: 2px; color: ${C.gold}; text-shadow: 2px 2px 0 rgba(0,0,0,.6);
  }

  /* Já passou: continua na lista, porque a semana se lê inteira, mas recua
     para o que ainda vai acontecer ficar na frente do olho. */
  .ag-passou { opacity: .55; box-shadow: ${sombra("rente")}; }

  /* O próximo (ou o que está rolando) ganha o anel de ouro. */
  .ag-destaque { box-shadow: ${sombra("alto")}, 0 0 0 3px ${C.gold}; }

  .ag-etiqueta {
    position: absolute; top: 6px; left: 6px;
    display: inline-flex; align-items: center; gap: 5px;
    font-family: ${FONT_ELITE}; font-size: 9px; letter-spacing: 1.6px; text-transform: uppercase;
    color: ${C.gold}; background: ${C.ink};
    padding: 3px 8px; border: 1px solid ${C.gold};
  }
  .ag-ponto {
    width: 6px; height: 6px; border-radius: 50%; background: #FF3B30;
    box-shadow: 0 0 0 2px rgba(255,59,48,.3);
    animation: agPulse 1.6s ease-in-out infinite;
  }

  .ag-texto { min-width: 0; }
  .ag-item-titulo {
    font-family: ${FONT_ALFA};
    font-size: clamp(17px, 2.4vw, 23px);
    line-height: 1.12; letter-spacing: .4px; text-transform: uppercase;
    margin: 0 0 5px; color: var(--fg);
  }
  .ag-item-sub { margin: 0; font-size: 13.5px; line-height: 1.4; color: var(--sub); }

  .ag-meta {
    display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
    padding-left: 18px; border-left: 2px solid rgba(24,18,3,.3);
    text-align: right; white-space: nowrap;
  }
  .ag-cartao-claro .ag-meta { border-left-color: rgba(246,245,239,.3); }
  .ag-meta-data {
    font-family: ${FONT_ELITE}; font-size: 12.5px; letter-spacing: 1.4px;
    color: var(--fg); opacity: .95;
  }
  .ag-meta-sep { opacity: .55; }
  .ag-meta-dia {
    font-family: ${FONT_ALFA}; font-size: clamp(15px, 2vw, 20px);
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--fg);
  }

  .ag-selo {
    width: 42px; height: 42px; flex: 0 0 auto;
    display: grid; place-items: center;
    background: var(--badge); color: var(--badge-fg);
    border: 2px solid ${C.ink}; border-radius: 10px;
    box-shadow: ${sombra("rente")};
  }

  .ag-vazio {
    text-align: center; font-family: ${FONT_ELITE}; letter-spacing: 1.5px;
    color: ${C.cream}; background: rgba(20,17,12,.6);
    border: 2px solid ${C.ink}; padding: 26px 18px;
  }

  .ag-rodape {
    margin-top: 30px; text-align: center;
    font-family: ${FONT_ELITE}; font-size: 11.5px; letter-spacing: 1.2px; line-height: 1.7;
    color: ${C.cream}; opacity: .85; text-shadow: 0 1px 6px rgba(0,0,0,.7);
  }
  .ag-rodape p { margin: 0; }

  @keyframes agIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes agPulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

  /* ===== Tablet ===== */
  @media (max-width: 860px) {
    .ag-cartao { grid-template-columns: 140px minmax(0, 1fr) auto; gap: 14px; }
    .ag-selo { display: none; }
  }

  /* ===== Celular ===== */
  @media (max-width: 620px) {
    .ag-cartao {
      grid-template-columns: 1fr;
      gap: 0;
      padding: 10px;
    }
    /* miniatura vira faixa: mantém o ritmo da lista sem esticar o cartão */
    .ag-thumb { width: 100%; margin-bottom: 12px; aspect-ratio: 5 / 2; max-height: 150px; }
    /* No celular o cartão é de uma coluna só: não há coluna reservada para
       preencher, e a faixa hachurada custaria de volta a altura que o conserto
       da agenda devolveu — era um evento e meio por tela. Aqui sobra só a
       etiqueta, como selo no topo do cartão.
       Precisa estar DENTRO da media query: a regra do .ag-thumb acima tem a
       mesma especificidade e vem depois no arquivo, então venceria o que está
       declarado lá em cima. (E nada de crase aqui: isto mora dentro de um
       template literal.) */
    .ag-thumb-reserva {
      aspect-ratio: auto; max-height: none; margin-bottom: 0;
      background: none; border: 0;
      display: flex; align-items: flex-start;
    }
    .ag-thumb-reserva .ag-reserva-sigla { display: none; }
    .ag-thumb-reserva .ag-etiqueta { position: static; margin-bottom: 10px; }
    .ag-texto { padding: 0 2px; }
    .ag-meta {
      flex-direction: row; align-items: baseline; justify-content: space-between;
      gap: 10px; width: 100%; text-align: left;
      padding: 10px 2px 2px; margin-top: 10px;
      border-left: 0; border-top: 2px solid rgba(24,18,3,.3);
      /* solta o nowrap: data/hora longa vinda do painel empurrava a coluna
         e gerava rolagem horizontal na página inteira */
      white-space: normal;
    }
    .ag-cartao-claro .ag-meta { border-top-color: rgba(246,245,239,.3); }
    .ag-titulo { letter-spacing: 1.5px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .ag-item { animation: none; }
    .ag-cartao, .ag-voltar, .ag-canal { transition: none !important; }
    .ag-ponto { animation: none; }
  }
`;

export default ProgramacaoClient;
