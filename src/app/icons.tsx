import React from "react";

/* Ícones Tabler (outline, MIT) embutidos como SVG inline — sem webfont externa */

type IconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

const paths: Record<string, string[]> = {
  mountain: [
    "M3 20h18l-6.921 -14.612a2.3 2.3 0 0 0 -4.158 0l-6.921 14.612",
    "M7.5 11l2 2.5l2.5 -2.5l2 3l2.5 -2",
  ],
  whatsapp: [
    "M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9",
    "M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1",
  ],
  mail: [
    "M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10",
    "M3 7l9 6l9 -6",
  ],
  chevronRight: ["M9 6l6 6l-6 6"],
  instagram: [
    "M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4l0 -8",
    "M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0",
    "M16.5 7.5v.01",
  ],
  x: [
    "M4 4l11.733 16h4.267l-11.733 -16l-4.267 0",
    "M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772",
  ],
  youtube: [
    "M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8",
    "M10 9l5 3l-5 3l0 -6",
  ],
  tiktok: [
    "M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917",
  ],
  twitch: [
    "M4 5v11a1 1 0 0 0 1 1h2v4l4 -4h5.584c.266 0 .52 -.105 .707 -.293l2.415 -2.414c.187 -.188 .293 -.442 .293 -.708v-8.585a1 1 0 0 0 -1 -1h-14a1 1 0 0 0 -1 1l.001 0",
    "M16 8l0 4",
    "M12 8l0 4",
  ],
  kick: [
    "M4 4h5v4h3v-2h2v-2h6v4h-2v2h-2v4h2v2h2v4h-6v-2h-2v-2h-3v4h-5l0 -16",
  ],
  video: [
    "M15 10l4.553 -2.276a1 1 0 0 1 1.447 .894v6.764a1 1 0 0 1 -1.447 .894l-4.553 -2.276v-4",
    "M3 8a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2l0 -8",
  ],
  arrowLeft: ["M5 12l14 0", "M5 12l6 6", "M5 12l6 -6"],
  close: ["M18 6l-12 12", "M6 6l12 12"],
};

export type IconName = keyof typeof paths;

export const Icon: React.FC<IconProps & { name: IconName }> = ({
  name,
  size = 24,
  className,
  style,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
    focusable="false"
  >
    {paths[name].map((d, i) => (
      <path key={i} d={d} />
    ))}
  </svg>
);
