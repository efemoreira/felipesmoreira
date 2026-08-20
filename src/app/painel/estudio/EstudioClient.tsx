"use client";

import dynamic from "next/dynamic";

/**
 * O Konva precisa de `window`, então o editor não pode ser pré-renderizado —
 * o `output: export` do site geraria erro na build.
 */
const Estudio = dynamic(() => import("./Estudio"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-[color:var(--e-fundo)] text-sm text-[color:var(--e-t3)]">
      Abrindo o estúdio…
    </div>
  ),
});

export default function EstudioClient() {
  return <Estudio />;
}
