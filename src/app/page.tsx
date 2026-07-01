"use client";
// src/app/page.tsx — Dashboard principal
import type { Metadata } from "next";
import { trpc } from "@/lib/trpc";

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number | string;
  label: string;
  color?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value" style={color ? { color } : {}}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function DashboardContent() {
  const { data: stats, isLoading } = trpc.messages.stats.useQuery();
  const { data: messagesData, isLoading: msgLoading } =
    trpc.messages.list.useQuery({ limit: 5 });

  const byTypeMap = Object.fromEntries(
    (stats?.byType ?? []).map((t) => [t.messageType, t._count.id])
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Dashboard{" "}
          <span className="gradient-text">CommHub</span>
        </h1>
        <p className="page-subtitle">
          Visão geral do sistema de comunicação multi-canal
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon="📨"
          value={isLoading ? "—" : (stats?.total ?? 0)}
          label="Total de mensagens"
        />
        <StatCard
          icon="✅"
          value={isLoading ? "—" : (stats?.sent ?? 0)}
          label="Enviadas"
          color="#34d399"
        />
        <StatCard
          icon="⏳"
          value={isLoading ? "—" : (stats?.pending ?? 0)}
          label="Pendentes"
          color="#fbbf24"
        />
        <StatCard
          icon="❌"
          value={isLoading ? "—" : (stats?.failed ?? 0)}
          label="Com falha"
          color="#f87171"
        />
      </div>

      {/* Por canal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Mensagens por canal</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { type: "EMAIL", icon: "✉️", label: "Email" },
              { type: "SMS", icon: "💬", label: "SMS" },
              { type: "WHATSAPP", icon: "📱", label: "WhatsApp" },
              { type: "PUSH", icon: "🔔", label: "Push" },
            ].map(({ type, icon, label }) => {
              const count = byTypeMap[type] ?? 0;
              const total = stats?.total ?? 1;
              const pct = Math.round((count / total) * 100) || 0;
              return (
                <div key={type}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.82rem" }}>
                    <span>{icon} {label}</span>
                    <span style={{ color: "var(--text-muted)" }}>{count}</span>
                  </div>
                  <div style={{ height: "6px", background: "var(--bg-elevated)", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
                        borderRadius: "999px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Taxa de sucesso</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, paddingTop: "1rem" }}>
            <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "#34d399" }}>
              {stats?.total
                ? Math.round(((stats.sent ?? 0) / stats.total) * 100)
                : 0}%
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {stats?.sent ?? 0} de {stats?.total ?? 0} mensagens enviadas com sucesso
            </p>
          </div>
        </div>
      </div>

      {/* Mensagens recentes */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Mensagens recentes</h2>
          <a href="/messages" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", textDecoration: "none" }}>
            Ver todas →
          </a>
        </div>
        {msgLoading ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Carregando…</div>
        ) : !messagesData?.messages.length ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Nenhuma mensagem ainda. Envie um POST para{" "}
            <code style={{ color: "var(--accent-secondary)", fontSize: "0.8rem" }}>/api/webhook</code> para começar.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {messagesData.messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.65rem 0.75rem",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>
                  {{ EMAIL: "✉️", SMS: "💬", WHATSAPP: "📱", PUSH: "🔔" }[msg.messageType]}
                </span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {msg.subject ?? msg.body.slice(0, 50)}
                </span>
                <span
                  style={{
                    padding: "0.15rem 0.5rem",
                    borderRadius: "999px",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    background:
                      msg.status === "SENT"
                        ? "rgba(16,185,129,0.15)"
                        : msg.status === "FAILED"
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(245,158,11,0.15)",
                    color:
                      msg.status === "SENT"
                        ? "#34d399"
                        : msg.status === "FAILED"
                        ? "#f87171"
                        : "#fbbf24",
                  }}
                >
                  {msg.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
