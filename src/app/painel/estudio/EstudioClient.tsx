"use client";

import dynamic from "next/dynamic";

/**
 * O Konva precisa de `window`, então o editor não pode ser pré-renderizado —
 * o `output: export` do site geraria erro na build.
 */
const Estudio = dynamic(() => import("./Estudio"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-[#0D0B08] text-sm text-white/40">
      Abrindo o estúdio…
    </div>
  ),
});

export default function EstudioClient() {
  return <Estudio />;
}
