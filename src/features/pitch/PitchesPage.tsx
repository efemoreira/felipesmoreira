import Link from "next/link";
import { Icon } from "@/components/icons";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { AberturaPagina } from "@/components/site/AberturaPagina";
import { PITCHES } from "@/features/pitch/projetos";
import { C } from "@/lib/theme";

export default function PitchesPage() {
  return (
    <PaginaDoSite
      abertura={
        <AberturaPagina
          trilha="Pitches"
          kicker="Felipe Moreira"
          titulo="Pitches de projetos"
          intro={<p>Ideias em formato de apresentação: cada projeto tem problema, solução, modelo de negócio e o que precisa para virar produto real.</p>}
        />
      }
    >
      <div className="s-grade s-grade-2">
        {PITCHES.map((pitch) => (
          <Link key={pitch.slug} href={`/pitch/${pitch.slug}`} prefetch={false} className="s-cartao">
            <span className="s-etiqueta" style={{ alignSelf: "flex-start", background: pitch.marca.primaria, color: C.paper }}>
              {pitch.marca.primaria === "#0F4C5C" ? "Produto" : "Ideia"}
            </span>
            <span style={{ fontSize: 26, lineHeight: 1.2, fontWeight: 800, letterSpacing: "-.01em", color: pitch.marca.escuro }}>{pitch.nome}</span>
            <span style={{ flex: 1, fontSize: 17, lineHeight: 1.55, color: C.suave }}>{pitch.descricao}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
              Abrir apresentação
              <Icon name="chevronRight" size={18} />
            </span>
          </Link>
        ))}
      </div>
    </PaginaDoSite>
  );
}
