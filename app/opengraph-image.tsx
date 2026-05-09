import { ImageResponse } from "next/og";

export const alt = "Oceanveo - Data for Physical Intelligence";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #020a18 0%, #07121e 55%, #123a48 100%)",
          color: "white",
          padding: 72,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 40,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              border: "3px solid rgba(139, 218, 239, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8bdaef",
            }}
          >
            V
          </div>
          Oceanveo
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 74,
              lineHeight: 0.98,
              letterSpacing: 0,
              fontWeight: 700,
              maxWidth: 950,
            }}
          >
            Real-world data for physical intelligence.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.76)",
              maxWidth: 880,
            }}
          >
            VLA-ready video trajectories and expert-collected datasets for
            robotics, humanoids, and autonomous systems.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#8bdaef",
          }}
        >
          <span>Data for Physical Intelligence</span>
          <span>oceanveo.ai</span>
        </div>
      </div>
    ),
    size,
  );
}
