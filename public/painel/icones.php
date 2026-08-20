<?php
declare(strict_types=1);

/**
 * Ícones do painel — os mesmos traçados de src/components/icons.tsx (Tabler,
 * MIT), para o painel e o site falarem a mesma língua visual.
 *
 * Só define função, não imprime nada sozinho.
 */

/** Traçados por nome. Acrescentar aqui e no icons.tsx do site, para não divergir. */
const ICONE_TRACOS = [
    'calendar'      => ['M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12', 'M16 3v4', 'M8 3v4', 'M4 11h16'],
    'star'          => ['M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z'],
    'play'          => ['M7 4v16l13 -8z'],
    'users'         => ['M5 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0', 'M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2', 'M16 3.13a4 4 0 0 1 0 7.75', 'M21 21v-2a4 4 0 0 0 -3 -3.85'],
    'flag'          => ['M5 14h14l-4.5 -4.5l4.5 -4.5h-14', 'M5 21v-18'],
    'book'          => ['M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z', 'M19 16h-12a2 2 0 0 0 -2 2', 'M9 8h6'],
    'world'         => ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0', 'M3.6 9h16.8', 'M3.6 15h16.8', 'M11.5 3a17 17 0 0 0 0 18', 'M12.5 3a17 17 0 0 1 0 18'],
    'whatsapp'      => ['M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9', 'M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1'],
    'chevronRight'  => ['M9 6l6 6l-6 6'],
    'arrowLeft'     => ['M5 12l14 0', 'M5 12l6 6', 'M5 12l6 -6'],
    'clock'         => ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0', 'M12 7v5l3 3'],
    'pin'           => ['M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0', 'M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z'],
    'mail'          => ['M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10', 'M3 7l9 6l9 -6'],
    'search'        => ['M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 0 0 -14 0', 'M21 21l-6 -6'],
    'bolt'          => ['M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11'],
    'ticket'        => ['M15 5l0 2', 'M15 11l0 2', 'M15 17l0 2', 'M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-3a2 2 0 0 0 0 -4v-3a2 2 0 0 1 2 -2'],
];

/** As áreas do painel e o ícone de cada uma. */
const ICONE_AREA = [
    'agenda'     => 'calendar',
    'estudio'    => 'star',
    'aulas'      => 'play',
    'fatos'      => 'search',
    'producao'   => 'bolt',
    'eventos'    => 'ticket',
    'inscricoes' => 'flag',
    'usuarios'   => 'users',
];

/** SVG inline, no mesmo traço do site (stroke 2, ponta e junta arredondadas). */
function icone(string $nome, int $tamanho = 24): string
{
    $tracos = ICONE_TRACOS[$nome] ?? null;
    if ($tracos === null) {
        return '';
    }
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' . $tamanho . '" height="' . $tamanho
         . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
         . ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
    foreach ($tracos as $d) {
        $svg .= '<path d="' . h($d) . '"/>';
    }
    return $svg . '</svg>';
}
