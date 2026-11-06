"use client";
import React from "react";
import { Icon } from "@/components/icons";
import { C, TEXTO } from "@/lib/theme";
import type { Nucleo } from "@/lib/api/organizacao";
import { NIVEIS_TERRITORIO } from "./catalogo";
import { BotaoCartao, LinhaProxima, Moldura, Reconhecimento, Secao, SeloIcone, mesPorExtenso } from "./Moldura";
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
    <article className="s-cartao">
      <header className="o-cabeca">
        <SeloIcone nome="pin" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{n.nome}</h3>
          <p className="o-sub">{[n.bairro, n.cidade].filter(Boolean).join(", ")}</p>
        </div>
      </header>
      <p className="o-info">
        {NIVEIS_TERRITORIO[n.nivel] ?? n.nivel} · {n.ritmo.toLowerCase()}
      </p>
      {n.proxima && <LinhaProxima data={n.proxima.data} texto={n.proxima.texto} atividade={n.proxima.atividade} />}
      <BotaoCartao href={`/queroajudar?unidade=${n.id}`}>Tenho interesse</BotaoCartao>
    </article>
  );
}

export default function Nucleos() {
  const estado = useOrganizacao();
  const nucleos = estado.fase === "pronto" ? estado.dados.nucleos : [];
  const cidades = [...new Set(nucleos.map((n) => n.cidade))];

  return (
    <Moldura
      trilha="Núcleos"
      icone="pin"
      titulo="A Missão onde você está"
      acoes={[{ texto: "Ajudar a construir um núcleo", href: "/queroajudar?frente=territorio" }, { texto: "Conhecer o plano", href: "/plano" }]}
      intro={
        <p>
          Estamos reunindo pessoas por cidade, bairro e instituição de ensino para construir núcleos.
          Cadastre onde você mora e, se estuda ou trabalha numa universidade, informe a instituição e o campus.
          Missão UNIFOR, por exemplo, será uma articulação universitária, que pode colaborar com os grupos temáticos.
        </p>
      }
    >
      {estado.fase === "pronto" && (
        <Reconhecimento
          titulo={`Entregaram em ${mesPorExtenso(estado.dados.reconhecimento.mes)}`}
          nomes={estado.dados.reconhecimento.nucleos}
        />
      )}

      <Secao titulo="Articulações publicadas" sub="São referências para a construção. A coordenação combina os próximos passos com os interessados; cadastro não significa núcleo ativo.">
        {estado.fase === "carregando" && <p className="s-corpo">Carregando os núcleos…</p>}
        {estado.fase === "erro" && (
          <p className="s-corpo">
            Não consegui carregar a lista agora. Tente de novo em instantes, ou deixe seu contato e a
            coordenação te diz qual é o núcleo mais perto.
          </p>
        )}
        {estado.fase === "pronto" && nucleos.length === 0 && (
          <p className="s-corpo">
            Ainda estamos mapeando os interessados. Informe sua cidade, bairro e instituição no cadastro, mesmo que seu lugar ainda não apareça aqui. Você pode participar sem assumir uma coordenação.
          </p>
        )}
        {cidades.map((cidade) => (
          <div key={cidade} className="o-bloco-cidade">
            {cidades.length > 1 && <h3 className="o-cidade">{cidade}</h3>}
            <div className="s-grade s-grade-3">
              {nucleos.filter((n) => n.cidade === cidade).map((n) => (
                <CartaoNucleo key={n.id} n={n} />
              ))}
            </div>
          </div>
        ))}
      </Secao>

      <Secao titulo="O que um núcleo faz" lado>
        <ul className="s-linhas">
          {O_QUE_FAZ.map((t) => (
            <li key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start", ...TEXTO.corpo }}>
              <span aria-hidden="true" style={{ color: C.goldDim, marginTop: 2 }}>
                <Icon name="check" size={20} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Por onde começamos" sub="Crescer por onde o eleitor do 14 já está. A ordem saiu dos resultados de 2026, cidade por cidade e bairro por bairro." lado>
        <ol className="s-linhas">
          {ONDAS_PUBLICAS.map((o) => (
            <li key={o.onda} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span aria-hidden="true" className="s-selo" style={{ borderRadius: "50%", fontWeight: 800, fontSize: 18 }}>{o.onda}</span>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 19, lineHeight: 1.3, fontWeight: 800, margin: "0 0 3px" }}>{o.titulo}</h3>
                <p className="s-corpo">{o.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="o-nota">Mora em outro lugar? Melhor ainda: é assim que nasce a próxima onda.</p>
      </Secao>
    </Moldura>
  );
}
