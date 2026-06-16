import React from "react";
import Script from "next/script";

export default function IntegrationGuide() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", color: "#0f172a", padding: "4rem 2rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <header style={{ marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "1rem", letterSpacing: "-0.025em" }}>
            AI Chatbot Integration Guide
          </h1>
          <p style={{ fontSize: "1.125rem", color: "#475569", lineHeight: "1.6" }}>
            Follow the instructions below to embed the Comfort Inn AI concierge widget directly into the client's codebase.
          </p>
        </header>

        <section style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>1. Copy the Script Tag</h2>
          <p style={{ color: "#475569", marginBottom: "1rem" }}>
            Add the following snippet just before the closing <code>&lt;/body&gt;</code> tag in the client's website HTML, or add it to their main layout file.
          </p>
          <pre style={{ backgroundColor: "#0f172a", color: "#f8fafc", padding: "1.5rem", borderRadius: "0.5rem", overflowX: "auto", fontSize: "0.875rem" }}>
            <code>
              {`<script src="https://your-chatbot-domain.com/widget.js" async defer></script>`}
            </code>
          </pre>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "1rem" }}>
            * Remember to replace <code style={{ backgroundColor: "#f1f5f9", padding: "0.2rem 0.4rem", borderRadius: "0.25rem" }}>https://your-chatbot-domain.com</code> with the actual domain where this chatbot application is hosted.
          </p>
        </section>

        <section style={{ backgroundColor: "#ffffff", padding: "2rem", borderRadius: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>2. Test the Widget</h2>
          <p style={{ color: "#475569" }}>
            The widget is currently active on this page for testing purposes. Look at the bottom-right corner of your screen to see the chatbot in action. It loads exactly as it will on the client's website.
          </p>
        </section>

        <footer style={{ marginTop: "2rem", color: "#94a3b8", fontSize: "0.875rem", textAlign: "center" }}>
          Powered by Elara AI Chatbot System
        </footer>

      </div>

      {/* Widget Injection for testing on this page */}
      <Script src="/widget.js" strategy="lazyOnload" />
    </div>
  );
}
