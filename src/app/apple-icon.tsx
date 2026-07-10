import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

/* Ícone Apple touch (180×180) — monograma do cordel */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14110C",
          color: "#FFCB05",
          fontSize: 96,
          fontWeight: 900,
          fontFamily: "sans-serif",
          border: "10px solid #FFCB05",
        }}
      >
        FM
      </div>
    ),
    { ...size }
  );
}
