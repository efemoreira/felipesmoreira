"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, PONTOS, RAIO, borda, sombra } from "@/lib/theme";
import { CAMINHO_AGENDA_AO_VIVO, normalizarAgenda } from "@/features/programacao/dados";
import { emOrdem, soFuturos } from "@/features/programacao/tempo";
import type { ItemAgenda } from "@/features/programacao/tipos";

/**
 * "PRÓXIMOS ENCONTROS" NA HOME — a prova de que tem gente fazendo.
 *
 * A pergunta de quem acabou de chegar é "e quando é que acontece alguma
 * coisa?". Até três itens que ainda vão acontecer, lidos do mesmo `agenda.json`
 * da /programacao. Sem nada marcado, a seção não aparece: seção vazia na home é
 * pior que seção nenhuma.
 */
export function ProximosEncontros() {
  const [itens, setItens] = useState<ItemAgenda[]>([]);

  useEffect(() => {
    let vivo = true;
    fetch(`${CAMINHO_AGENDA_AO_VIVO}?v=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const agenda = normalizarAgenda(json);
        if (vivo && agenda) setItens(emOrdem(soFuturos(agenda.programacao.filter((i) => !i.interno))).slice(0, 3));
      })
      .catch(() => {
        /* sem agenda agora: a home segue sem a seção */
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (itens.length === 0) return null;

  return (
    <section aria-labelledby="h-encontros" className="s-secao he">
      <div className="s-largura">
        <div className="he-cabeca">
          <h2 id="h-encontros" className="s-titulo">Próximos encontros</h2>
          <Link href="/programacao" prefetch={false} className="s-link">
            Ver a agenda completa
            <Icon name="chevronRight" size={18} />
          </Link>
        </div>
        <ul className="he-lista">
          {itens.map((i) => {
            const [dd, mm] = i.data.split("/");
            return (
              <li key={i.id}>
                <Link href={`/programacao#a-${i.id}`} prefetch={false} className="he-item">
                  <span className="he-data" aria-hidden="true">
                    <strong>{dd}</strong>
                    <span>{MESES[Number(mm) - 1] ?? ""}</span>
                  </span>
                  <span className="he-texto">
                    <strong>{i.titulo}</strong>
                    <span>
                      {i.dia}, {i.hora.toLowerCase()}
                      {(i.local || i.plataforma) && ` · ${i.local || i.plataforma}`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <style>{`
        .he { padding-top: 0; }
        .he-cabeca { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; margin-bottom: 20px; }
        .he-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .he-item {
          display: flex; align-items: center; gap: 16px; height: 100%; padding: 14px 16px; text-decoration: none; color: ${C.ink};
          background: ${C.paper}; border: ${borda()}; border-radius: ${RAIO.g}px; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }
        .he-item:hover { transform: translateY(-2px); box-shadow: ${sombra("cartao")}; border-color: ${C.linhaForte}; }
        .he-data { flex: 0 0 auto; width: 64px; height: 68px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: ${RAIO.m}px; background: ${C.gold}; color: ${C.ink}; line-height: 1; }
        .he-data strong { font-family: ${FONT_ALFA}; font-weight: 400; font-size: 28px; }
        .he-data span { margin-top: 4px; font-size: 14px; font-weight: 700; }
        .he-texto { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .he-texto strong { font-size: 17.5px; line-height: 1.3; font-weight: 700; }
        .he-texto span { font-size: 15.5px; line-height: 1.4; color: ${C.suave}; }
        @media (min-width: ${PONTOS.computador}px) { .he-lista { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; } }
        @media (prefers-reduced-motion: reduce) { .he-item { transition: none; } .he-item:hover { transform: none; } }
      `}</style>
    </section>
  );
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
