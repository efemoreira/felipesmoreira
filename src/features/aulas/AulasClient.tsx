"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import { obterAulas, marcarAula } from "@/lib/api/aulas";
import { ListaDias } from "./ListaDias";
import type { Dia, RespostaAulas } from "./tipos";

/**
 * A formação da militância — Pista Rápida e Pista Lenta.
 *
 * O conteúdo não está neste arquivo nem em lugar nenhum do build: ele chega do
 * painel (api/aulas.php) já filtrado pela permissão. Num export estático tudo
 * que entra no bundle é público, e o manual é documento interno — por isso a
 * página nasce vazia e se preenche depois de o painel dizer quem é o visitante.
 */

type Estado =
  | { fase: "carregando" }
  | { fase: "sem-login" }
  | { fase: "sem-acesso" }
  | { fase: "erro" }
  | {
      fase: "liberado";
      nome: string;
      dias: Dia[];
      funcoes: Set<string>;
      /** entrou por link de convite: vê só o Dia 0 e não tem onde gravar progresso */
      convidado: boolean;
    };

export default function AulasClient() {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const [concluidas, setConcluidas] = useState<Set<string>>(new Set());
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [gravando, setGravando] = useState<string | null>(null);
  const [falhaAoGravar, setFalhaAoGravar] = useState(false);

  useEffect(() => {
    let ativo = true;

    const convite = new URLSearchParams(window.location.search).get("convite") ?? "";

    obterAulas(convite)
      .then((r: RespostaAulas) => {
        if (!ativo) return;
        const convidado = !r.autenticado && r.convidado === true;
        if (!r.autenticado && !convidado) return setEstado({ fase: "sem-login" });
        if (!("pode" in r) || !r.pode) return setEstado({ fase: "sem-acesso" });

        setConcluidas(new Set(r.concluidas));
        setEstado({
          fase: "liberado",
          nome: r.nome,
          dias: r.dias,
          funcoes: new Set(r.funcoes),
          convidado,
        });

        /* deep link: /aulas#olheiro abre e rola até a aula */
        const alvo = window.location.hash.replace("#", "");
        if (alvo) {
          setAbertaId(alvo);
          // espera o React desenhar a aula antes de procurar o elemento
          requestAnimationFrame(() => {
            document.getElementById(alvo)?.scrollIntoView({ block: "start" });
          });
        } else if (r.concluidas.length === 0) {
          /* Primeira visita: abre a aula de boas-vindas, que é a primeira do
             Dia 0 e explica as pistas. Sem ela, quem chega recebe uma lista de
             32 títulos fechados e nenhuma pista de por onde começar. Não rola a
             página — a aula já está no topo. */
          setAbertaId(r.dias[0]?.aulas[0]?.id ?? null);
        }
      })
      .catch(() => {
        if (ativo) setEstado({ fase: "erro" });
      });

    return () => {
      ativo = false;
    };
  }, []);

  const aoAbrir = useCallback((id: string, aberta: boolean) => {
    if (aberta) {
      setAbertaId(id);
      // deixa o endereço compartilhável sem encher o histórico do navegador
      window.history.replaceState(null, "", `#${id}`);
      return;
    }
    /* Abrir uma aula fecha a anterior, e o navegador dispara o toggle dela
       depois. Só zera se quem fechou for mesmo a aula que estava aberta —
       senão esse toggle atrasado fecharia a que acabou de abrir. */
    setAbertaId((atual) => (atual === id ? null : atual));
  }, []);

  const aoAlternar = useCallback(async (id: string, concluida: boolean) => {
    setGravando(id);
    setFalhaAoGravar(false);

    // otimista: a marca aparece na hora e volta atrás se o painel recusar
    setConcluidas((atual) => {
      const proximo = new Set(atual);
      if (concluida) {
        proximo.add(id);
      } else {
        proximo.delete(id);
      }
      return proximo;
    });

    try {
      setConcluidas(new Set(await marcarAula(id, concluida)));
    } catch {
      setFalhaAoGravar(true);
      setConcluidas((atual) => {
        const proximo = new Set(atual);
        if (concluida) {
          proximo.delete(id);
        } else {
          proximo.add(id);
        }
        return proximo;
      });
    } finally {
      setGravando(null);
    }
  }, []);

  const resumo = useMemo(() => {
    if (estado.fase !== "liberado") return null;
    const todas = estado.dias.flatMap((d) => d.aulas);
    const rapidas = todas.filter((a) => a.pista === "rapida");
    return {
      total: todas.length,
      feitas: todas.filter((a) => concluidas.has(a.id)).length,
      rapidas: rapidas.length,
      rapidasFeitas: rapidas.filter((a) => concluidas.has(a.id)).length,
      minhas: todas.filter((a) => a.funcoes.some((f) => estado.funcoes.has(f))),
    };
  }, [estado, concluidas]);

  /* ---------- telas de espera e de porta fechada ---------- */

  if (estado.fase !== "liberado") {
    return <Recado fase={estado.fase} />;
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.night,
        color: C.cream,
        fontFamily: FONT_BITTER,
        padding: "36px 18px 90px",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            minHeight: 44,
            textDecoration: "none",
            color: "#8e877a",
            fontFamily: FONT_ELITE,
            fontSize: 12,
            letterSpacing: 1.4,
            textTransform: "uppercase",
          }}
        >
          <Icon name="arrowLeft" size={16} />
          Voltar ao site
        </Link>

        <header style={{ margin: "10px 0 34px" }}>
          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(28px, 7vw, 44px)",
              lineHeight: 1.15,
              margin: "0 0 12px",
              color: C.gold,
            }}
          >
            Formação da militância
          </h1>
          {/* O conceito das pistas é explicado na primeira aula, não aqui: texto
              repetido em dois lugares é texto que diverge na terceira alteração
              (mesmo motivo do checklists.php). */}
          <p style={{ margin: "0 0 18px", lineHeight: 1.75, maxWidth: "60ch" }}>
            {estado.convidado ? "Bem-vindo. " : `Olá, ${estado.nome.split(" ")[0]}. `}
            Cada Dia começa com uma{" "}
            <strong style={{ color: C.gold }}>🚗 Pista Rápida</strong> e segue nas Pistas Lentas.{" "}
            <a
              href="#como-funciona-a-formacao"
              onClick={() => aoAbrir("como-funciona-a-formacao", true)}
              style={{ color: C.gold }}
            >
              A primeira aula explica a diferença
            </a>{" "}
            em três minutos.
          </p>

          {resumo && !estado.convidado && (
            <>
              <Barra feitas={resumo.feitas} total={resumo.total} />
              <p
                style={{
                  margin: "10px 0 0",
                  fontFamily: FONT_ELITE,
                  fontSize: 12,
                  letterSpacing: 1.3,
                  color: "#8e877a",
                }}
              >
                {resumo.feitas} de {resumo.total} aulas · Pistas Rápidas{" "}
                {resumo.rapidasFeitas} de {resumo.rapidas}
              </p>
            </>
          )}
        </header>

        {resumo && !estado.convidado && resumo.minhas.length > 0 && (
          <MinhaTrilha
            aulas={resumo.minhas.map((a) => ({ id: a.id, titulo: a.titulo }))}
            concluidas={concluidas}
            aoIr={aoAbrir}
          />
        )}

        {estado.convidado && <AvisoConvidado />}

        {falhaAoGravar && (
          <p
            style={{
              border: `3px solid ${C.erroBorda}`,
              background: "rgba(194,84,63,.12)",
              color: C.erro,
              padding: "12px 14px",
              margin: "0 0 22px",
              lineHeight: 1.6,
            }}
          >
            Não consegui guardar seu progresso — confira a conexão e tente de novo.
          </p>
        )}

        <ListaDias
          dias={estado.dias}
          concluidas={concluidas}
          minhasFuncoes={estado.funcoes}
          abertaId={abertaId}
          gravando={gravando}
          aoAbrir={aoAbrir}
          aoAlternar={aoAlternar}
          semProgresso={estado.convidado}
        />
      </div>
    </div>
  );
}

/* ===================== peças ===================== */

/**
 * O recado de quem entrou por convite.
 *
 * Diz o que ele está vendo (o Dia 0) e o que falta para ver o resto — sem
 * fingir que a formação inteira está ali e sem tratar a espera como problema
 * dele. O botão é a única coisa que resolve: falar com a coordenação.
 */
const AvisoConvidado: React.FC = () => (
  <section
    style={{
      border: `3px solid ${C.gold}`,
      background: "rgba(255,203,5,.08)",
      padding: "16px 16px",
      margin: "0 0 22px",
    }}
  >
    <p
      style={{
        fontFamily: FONT_ELITE,
        fontSize: 11.5,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: C.gold2,
        margin: "0 0 8px",
      }}
    >
      Você está no Dia 0
    </p>
    <p style={{ margin: "0 0 12px", lineHeight: 1.7 }}>
      Estas são as regras que valem para todo mundo — dá pra começar por elas
      antes mesmo de ter acesso. A formação inteira são <strong>6 Dias e 32 aulas</strong>,
      e o resto abre quando a coordenação aprovar sua inscrição.
    </p>
    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, opacity: 0.85 }}>
      Como você ainda não tem conta, aqui não dá pra marcar aula concluída — seu
      progresso começa a contar quando você entrar com seu usuário.
    </p>
  </section>
);

const Barra: React.FC<{ feitas: number; total: number }> = ({ feitas, total }) => (
  <div
    role="progressbar"
    aria-valuenow={feitas}
    aria-valuemin={0}
    aria-valuemax={total}
    aria-label="Aulas concluídas"
    style={{ height: 12, border: `2px solid ${C.gold}`, background: "rgba(0,0,0,.35)" }}
  >
    <div
      style={{
        width: total > 0 ? `${(feitas / total) * 100}%` : 0,
        height: "100%",
        background: C.gold,
        transition: "width .25s ease",
      }}
    />
  </div>
);

/** Atalho para as aulas da função da pessoa — o resto continua aberto a todos. */
const MinhaTrilha: React.FC<{
  aulas: { id: string; titulo: string }[];
  concluidas: Set<string>;
  aoIr: (id: string, aberta: boolean) => void;
}> = ({ aulas, concluidas, aoIr }) => (
  <section
    style={{
      border: `3px solid ${C.gold}`,
      background: "rgba(255,203,5,.08)",
      padding: "16px 18px",
      margin: "0 0 40px",
      boxShadow: "5px 5px 0 rgba(0,0,0,.35)",
    }}
  >
    <p
      style={{
        fontFamily: FONT_ELITE,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: C.gold,
        margin: "0 0 10px",
      }}
    >
      A sua função
    </p>
    <p style={{ margin: "0 0 14px", lineHeight: 1.7, color: "#b9b3a5" }}>
      Estas são as aulas do que você escolheu fazer no movimento. As outras continuam abertas —
      entender a etapa vizinha é o que faz a linha andar sem retrabalho.
    </p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {aulas.map((a) => (
        <a
          key={a.id}
          href={`#${a.id}`}
          onClick={() => aoIr(a.id, true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            minHeight: 44,
            padding: "8px 14px",
            textDecoration: "none",
            border: "2px solid rgba(255,203,5,.45)",
            color: concluidas.has(a.id) ? C.ok : C.cream,
            fontSize: 14,
          }}
        >
          {concluidas.has(a.id) && <span aria-hidden="true">✓</span>}
          {a.titulo}
        </a>
      ))}
    </div>
  </section>
);

/** Carregando, sem login, sem permissão e falha de rede — todas na mesma casca. */
const Recado: React.FC<{ fase: "carregando" | "sem-login" | "sem-acesso" | "erro" }> = ({
  fase,
}) => {
  const textos = {
    carregando: {
      titulo: "Verificando acesso…",
      corpo: "Um instante.",
      entrar: false,
    },
    "sem-login": {
      titulo: "Entre para estudar",
      corpo:
        "A formação é para quem já tem conta no painel. Se você se inscreveu em /quero-ajudar e ainda não recebeu o acesso, a coordenação chama você no WhatsApp.",
      entrar: true,
    },
    "sem-acesso": {
      titulo: "Acesso restrito",
      corpo:
        "Sua conta ainda não tem a área de Aulas liberada. Fale com a coordenação se você deveria ter acesso.",
      entrar: false,
    },
    erro: {
      titulo: "Não consegui carregar",
      corpo: "Confira sua conexão e recarregue a página.",
      entrar: false,
    },
  }[fase];

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: C.night,
        color: C.cream,
        fontFamily: FONT_BITTER,
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div>
        <p
          style={{
            display: "inline-block",
            fontFamily: FONT_ELITE,
            letterSpacing: 4,
            fontSize: 12,
            textTransform: "uppercase",
            color: C.ink,
            background: C.gold,
            padding: "4px 14px",
            boxShadow: "3px 3px 0 rgba(24,18,3,.5)",
            marginBottom: 18,
          }}
        >
          Formação
        </p>
        <h1
          style={{
            fontFamily: FONT_ALFA,
            fontSize: "clamp(28px, 6vw, 42px)",
            margin: "0 0 14px",
            color: C.gold,
          }}
        >
          {textos.titulo}
        </h1>
        <p style={{ maxWidth: 440, margin: "0 auto 24px", fontSize: 15, lineHeight: 1.7 }}>
          {textos.corpo}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {textos.entrar && (
            <a
              href="/painel/?volta=/painel/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                minHeight: 44,
                textDecoration: "none",
                background: C.gold,
                border: `3px solid ${C.ink}`,
                boxShadow: "5px 5px 0 rgba(24,18,3,.35)",
                color: C.ink,
                padding: "12px 20px",
                fontFamily: FONT_ALFA,
                fontSize: 15,
              }}
            >
              Entrar no painel
            </a>
          )}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              minHeight: 44,
              textDecoration: "none",
              border: "3px solid rgba(255,203,5,.4)",
              color: C.gold,
              padding: "12px 20px",
              fontFamily: FONT_ALFA,
              fontSize: 15,
            }}
          >
            <Icon name="arrowLeft" size={18} />
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
};
