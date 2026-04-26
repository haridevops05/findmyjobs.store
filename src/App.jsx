import { useState } from "react";

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "white", fontFamily: "Inter, sans-serif" }}>
      
      {/* 🚀 HERO SECTION */}
      {!started && (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h1 style={{ fontSize: "40px", fontWeight: "700" }}>
            🚀 Mercury Round AI
          </h1>

          <p style={{ fontSize: "18px", color: "#94a3b8", marginTop: "10px" }}>
            Crack Interviews. Switch Jobs Faster. Dominate Your Career.
          </p>

          <button
            onClick={() => setStarted(true)}
            style={{
              marginTop: "25px",
              padding: "14px 28px",
              background: "#6366f1",
              borderRadius: "10px",
              border: "none",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            🔥 Start Job Hunt
          </button>

          {/* TRUST */}
          <div style={{ marginTop: "40px", color: "#94a3b8" }}>
            <p>✔ AI-powered job matching</p>
            <p>✔ Real-time interview answers</p>
            <p>✔ Built for serious job switchers</p>
          </div>

          {/* STORY */}
          <div style={{ marginTop: "40px", maxWidth: "600px", marginInline: "auto" }}>
            <h3>Why Mercury Round?</h3>
            <p style={{ color: "#94a3b8" }}>
              Built by engineers who were tired of fake job listings,
              random applications, and poor interview prep.
              This gives you a real unfair advantage.
            </p>
          </div>
        </div>
      )}

      {/* ⚡ MAIN APP */}
      {started && (
        <div style={{ padding: "20px" }}>
          <h2 style={{ marginBottom: "10px" }}>⚡ Dashboard</h2>

          <div style={{ display: "grid", gap: "10px" }}>
            <div style={card}>🎯 AI Job Matching</div>
            <div style={card}>🎤 AI Interview Assistant</div>
            <div style={card}>📄 Resume Optimizer</div>
            <div style={card}>💰 Salary Calculator</div>
            <div style={card}>🤝 Negotiation AI</div>
            <div style={card}>📡 Live Job Feed</div>
            <div style={card}>🕵️ Stealth Interview Mode (Coming Soon)</div>
          </div>
        </div>
      )}
    </div>
  );
}

const card = {
  padding: "20px",
  background: "#0f172a",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.05)",
  cursor: "pointer"
};