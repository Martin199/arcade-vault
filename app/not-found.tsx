import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in" style={{ textAlign: "center", padding: "96px 16px" }}>
      <div className="pixel neon-magenta flicker" style={{ fontSize: 32, lineHeight: 1.4 }}>GAME OVER</div>
      <div className="pixel neon-cyan" style={{ fontSize: 14, marginTop: 16 }}>ERROR 404</div>
      <p className="mono" style={{ color: "var(--ink-dim)", marginTop: 24, letterSpacing: "0.08em" }}>
        Este cartucho no está en el Vault. Revisa la dirección o vuelve a la biblioteca.
      </p>
      <Link href="/" className="btn lg" style={{ marginTop: 32 }}>VOLVER AL VAULT</Link>
    </div>
  );
}
