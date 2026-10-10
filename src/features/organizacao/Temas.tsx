"use client";
import React from "react";
import { C, FONT_ALFA, TEXTO, bordaFina } from "@/lib/theme";
import type { Grupo } from "@/lib/api/organizacao";
import { TEMAS, type Tema } from "./catalogo";
import { BotaoEscuro, Moldura, Secao, SeloIcone, cartao, dataCurta, rotuloPequeno } from "./Moldura";
import { useOrganizacao } from "./useOrganizacao";

/**
 * /temas — sobre o quê a militância atua. Um tema, um grupo.
 *
 * Os nove temas do catálogo saem no HTML do build, cada um com as três portas
 * (estudo, profissionais, movimento): é a parte que explica e que o buscador
 * lê. O grupo de cada tema — se já existe, para que, quando é a próxima — vem
 * do painel por cima.
 */

const PORTAS = [
  { chave: "estudo", nome: "Estudo", texto: "Entende o problema e produz conteúdo: diagnóstico, dados, proposta, pauta para os porta-vozes." },
  { chave: "profissionais", nome: "Profissionais", texto: "Quem trabalha na área. Dá credibilidade técnica, faz encontros com pauta definida e traz colegas." },
  { chave: "movimento", nome: "Movimento", texto: "A ação pública do tema: campanhas, eventos abertos, mutirões — junto com os núcleos." },
] as const;

function CartaoTema({ t, g }: { t: Tema; g?: Grupo }) {
  const portas = g?.portas ?? { estudo: t.estudo, profissionais: t.profissionais, movimento: t.movimento };
  return (
    <article id={t.chave} style={{ ...cartao, scrollMarginTop: 18, ...(g ? {} : { boxShadow: "none", border: bordaFina(C.ink) }) }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SeloIcone nome={t.icone} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: FONT_ALFA, fontSize: 20, lineHeight: 1.15, margin: 0 }}>{t.nome}</h3>
          <p style={{ margin: "2px 0 0", ...TEXTO.nota, opacity: 0.8 }}>
            {g ? `Grupo aberto · ${g.ritmo.toLowerCase()}` : "Ainda sem grupo — pode ser o seu"}
          </p>
        </div>
      </header>
      {g?.finalidade && <p style={{ margin: 0, ...TEXTO.corpo }}>{g.finalidade}</p>}
      <dl style={{ margin: 0, display: "grid", gap: 8 }}>
        {PORTAS.map((p) => (
          <div key={p.chave}>
            <dt style={rotuloPequeno}>Porta {p.nome.toLowerCase()}</dt>
            <dd style={{ margin: 0, ...TEXTO.corpo }}>{portas[p.chave]}</dd>
          </div>
        ))}
        {g?.proxima && (
          <div>
            <dt style={rotuloPequeno}>Próxima atividade</dt>
            <dd style={{ margin: 0, ...TEXTO.corpo }}>
              <strong>{dataCurta(g.proxima.data)}</strong>
              {g.proxima.texto ? ` — ${g.proxima.texto}` : ""}
            </dd>
          </div>
        )}
        {g && (g.nucleos.length > 0 || g.portaVoz) && (
          <div>
            <dt style={rotuloPequeno}>Junto com</dt>
            <dd style={{ margin: 0, ...TEXTO.corpo }}>
              {[g.portaVoz && `${g.portaVoz} (porta-voz)`, ...g.nucleos.map((n) => `núcleo ${n}`)].filter(Boolean).join(" · ")}
            </dd>
          </div>
        )}
      </dl>
      {g?.contato ? (
        <BotaoEscuro href={g.contato} icone="whatsapp" externo>
          Entrar no grupo
        </BotaoEscuro>
      ) : (
        <BotaoEscuro href="/queroajudar">{g ? "Quero entrar" : "Quero ajudar a abrir"}</BotaoEscuro>
      )}
    </article>
  );
}

export default function Temas() {
  const estado = useOrganizacao();
  const grupos = estado.fase === "pronto" ? estado.dados.temas : [];
  const porTema = new Map(grupos.map((g) => [g.tema, g]));
  /* Os que têm grupo vêm primeiro: é onde já dá para entrar hoje. */
  const ordenados = [...TEMAS].sort((a, b) => Number(porTema.has(b.chave)) - Number(porTema.has(a.chave)));

  return (
    <Moldura
      kicker="Grupos temáticos"
      titulo="Um tema, um grupo"
      intro={
        <p style={{ margin: 0 }}>
          Cada assunto tem um grupo só — segurança, educação, saúde, economia… — e cada grupo tem três
          portas. Médico entra no de Saúde pela porta dos profissionais; quem quer organizar uma
          corrida no bairro entra pela do movimento. Ninguém precisa de um grupo à parte para a
          própria categoria.
        </p>
      }
    >
      <Secao titulo="As três portas">
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))" }}>
          {PORTAS.map((p) => (
            <div key={p.chave} style={{ ...cartao, boxShadow: "none", border: bordaFina(C.ink) }}>
              <h3 style={{ fontFamily: FONT_ALFA, fontSize: 18, margin: 0 }}>{p.nome}</h3>
              <p style={{ margin: 0, ...TEXTO.corpo }}>{p.texto}</p>
            </div>
          ))}
        </div>
        <p style={{ ...TEXTO.nota, margin: "12px 0 0" }}>
          Exemplo: o grupo de Saúde e esporte estuda o acesso às UPAs de um bairro, reúne médicos,
          enfermeiros e educadores físicos e organiza uma corrida comunitária com orientação de saúde.
          Um grupo só, com um responsável.
        </p>
      </Secao>

      <Secao
        titulo="Os temas"
        sub={
          estado.fase === "erro"
            ? "Não consegui ver agora quais grupos já estão abertos. Os temas e as portas estão aqui."
            : "Começamos com poucos grupos, bem cuidados. Tema sem grupo ainda é convite."
        }
      >
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))" }}>
          {ordenados.map((t) => (
            <CartaoTema key={t.chave} t={t} g={porTema.get(t.chave)} />
          ))}
        </div>
      </Secao>
    </Moldura>
  );
}
