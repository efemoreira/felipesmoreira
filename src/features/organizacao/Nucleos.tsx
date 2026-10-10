"use client";
import React from "react";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, TEXTO, bordaFina } from "@/lib/theme";
import type { Nucleo } from "@/lib/api/organizacao";
import { NIVEIS_TERRITORIO } from "./catalogo";
import { BotaoEscuro, Moldura, Secao, SeloIcone, cartao, dataCurta, rotuloPequeno } from "./Moldura";
import { useOrganizacao } from "./useOrganizacao";

/**
 * /nucleos — onde a militância atua.
 *
 * A parte fixa (o que é um núcleo, o que ele faz, por onde começamos) sai no
 * HTML do build e é indexável. A lista vem do painel: só o núcleo que a
 * coordenação marcou para o site, sem nome de ninguém — o lugar, o ritmo, a
 * próxima atividade e o contato público.
 */

const O_QUE_FAZ = [
  "Encontros abertos de apresentação",
  "Escuta dos problemas do lugar",
  "Atividades culturais e educativas",
  "Apoio a iniciativas cívicas locais",
  "Recebe os grupos temáticos e os porta-vozes para ações no território",
];

const ONDAS_PUBLICAS = [
  { onda: 1, titulo: "Fortaleza e Região Metropolitana", texto: "Onde o eleitor do 14 já está e já vota nos nossos nomes: Aldeota, Edson Queiroz, Dionísio Torres, Fátima, Cocó, Messejana, Barra do Ceará, José Walter, Maracanaú e Eusébio." },
  { onda: 2, titulo: "Cidades com potencial", texto: "Caucaia, Juazeiro do Norte e Crato, Sobral, Horizonte, Limoeiro do Norte e Iguatu." },
  { onda: 3, titulo: "Bases e polos menores", texto: "Acopiara, Beberibe, Marco, Jaguaribe, Brejo Santo, Jijoca, Bela Cruz, Cedro, Quixelô e outras." },
];

function CartaoNucleo({ n }: { n: Nucleo }) {
  return (
    <article style={cartao}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SeloIcone nome="pin" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: FONT_ALFA, fontSize: 20, lineHeight: 1.15, margin: 0 }}>{n.nome}</h3>
          <p style={{ margin: "2px 0 0", ...TEXTO.nota, opacity: 0.8 }}>
            {[n.bairro, n.cidade].filter(Boolean).join(" · ")} · {NIVEIS_TERRITORIO[n.nivel] ?? n.nivel}
          </p>
        </div>
      </header>
      <dl style={{ margin: 0, display: "grid", gap: 8 }}>
        <div>
          <dt style={rotuloPequeno}>Ritmo</dt>
          <dd style={{ margin: 0, ...TEXTO.corpo }}>{n.ritmo}</dd>
        </div>
        {n.proxima && (
          <div>
            <dt style={rotuloPequeno}>Próxima atividade</dt>
            <dd style={{ margin: 0, ...TEXTO.corpo }}>
              <strong>{dataCurta(n.proxima.data)}</strong>
              {n.proxima.texto ? ` — ${n.proxima.texto}` : ""}
            </dd>
          </div>
        )}
      </dl>
      {n.contato ? (
        <BotaoEscuro href={n.contato} icone="whatsapp" externo>
          Falar com o núcleo
        </BotaoEscuro>
      ) : (
        <BotaoEscuro href="/queroajudar">Quero entrar neste núcleo</BotaoEscuro>
      )}
    </article>
  );
}

export default function Nucleos() {
  const estado = useOrganizacao();
  const nucleos = estado.fase === "pronto" ? estado.dados.nucleos : [];
  const cidades = [...new Set(nucleos.map((n) => n.cidade))];

  return (
    <Moldura
      kicker="Núcleos"
      titulo="A Missão no seu bairro"
      intro={
        <p style={{ margin: 0 }}>
          O núcleo é a militância onde você mora, estuda ou trabalha: um grupo do bairro, da cidade ou
          da universidade, com alguém que responde por ele, encontros com ritmo certo e o registro do
          que foi feito. É assim que o voto vira presença que dura entre uma eleição e outra.
        </p>
      }
    >
      <Secao titulo="Os núcleos que já funcionam" sub="Só o que a coordenação publicou. Sem nome de ninguém: o lugar, o ritmo e como chegar.">
        {estado.fase === "carregando" && <p style={{ ...TEXTO.corpo, margin: 0 }}>Carregando os núcleos…</p>}
        {estado.fase === "erro" && (
          <p style={{ ...TEXTO.corpo, margin: 0 }}>
            Não consegui carregar a lista agora. Tente de novo em instantes — ou deixe seu contato e a
            coordenação te diz qual é o núcleo mais perto.
          </p>
        )}
        {estado.fase === "pronto" && nucleos.length === 0 && (
          <p style={{ ...TEXTO.corpo, margin: 0 }}>
            Os primeiros núcleos estão sendo abertos agora. Se você quer que o seu bairro seja um deles,
            deixe seu contato: núcleo começa com uma pessoa que topa responder por ele.
          </p>
        )}
        {cidades.map((cidade) => (
          <div key={cidade} style={{ marginBottom: 22 }}>
            <h3 style={{ ...rotuloPequeno, fontSize: 13, opacity: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="pin" size={15} /> {cidade}
            </h3>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
              {nucleos.filter((n) => n.cidade === cidade).map((n) => (
                <CartaoNucleo key={n.id} n={n} />
              ))}
            </div>
          </div>
        ))}
      </Secao>

      <Secao titulo="O que um núcleo faz">
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
          {O_QUE_FAZ.map((t) => (
            <li key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", ...TEXTO.corpo }}>
              <span aria-hidden="true" style={{ color: C.goldDim, marginTop: 2 }}>
                <Icon name="flag" size={16} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </Secao>

      <Secao
        titulo="Por onde começamos"
        sub="Crescer por onde o eleitor do 14 já está. A ordem saiu dos resultados de 2026, cidade por cidade e bairro por bairro."
      >
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
          {ONDAS_PUBLICAS.map((o) => (
            <li key={o.onda} style={{ ...cartao, flexDirection: "row", alignItems: "flex-start", boxShadow: "none", border: bordaFina(C.ink) }}>
              <span
                aria-hidden="true"
                style={{ fontFamily: FONT_ALFA, fontSize: 28, lineHeight: 1, minWidth: 28, color: C.goldDim }}
              >
                {o.onda}
              </span>
              <div>
                <h3 style={{ fontFamily: FONT_ALFA, fontSize: 18, margin: "0 0 4px" }}>{o.titulo}</h3>
                <p style={{ margin: 0, ...TEXTO.corpo }}>{o.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <p style={{ ...TEXTO.nota, margin: "12px 0 0" }}>
          Mora em outro lugar? Melhor ainda: é assim que nasce a próxima onda.
        </p>
      </Secao>
    </Moldura>
  );
}
