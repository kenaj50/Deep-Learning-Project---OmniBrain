"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pl">
      <body style={{ background: "#09090b", color: "#e4e4e7", margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px", textAlign: "center", padding: "24px" }}>
          <span style={{ fontSize: "40px" }}>⚠️</span>
          <p style={{ color: "#a1a1aa", fontSize: "14px" }}>Aplikacja napotkała błąd.</p>
          <button
            onClick={reset}
            style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "14px", cursor: "pointer" }}
          >
            Odśwież
          </button>
        </div>
      </body>
    </html>
  );
}
