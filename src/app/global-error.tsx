"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center", background: "#fdfaf5", color: "#2b1d14" }}>
        <h1>Something went wrong</h1>
        <p>Please try again in a moment.</p>
        <button type="button" onClick={reset} style={{ padding: "0.75rem 1.5rem", borderRadius: 999, border: 0, background: "#e39a3b", fontWeight: 600 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
