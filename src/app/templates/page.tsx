"use client";
// src/app/templates/page.tsx
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { TemplateForm } from "@/components/TemplateForm";
import type { MessageType } from "@/types";

const channelIcons: Record<MessageType, string> = {
  EMAIL: "✉️",
  SMS: "💬",
  WHATSAPP: "📱",
  PUSH: "🔔",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function TemplatesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<string | null>(null);

  const { data: templates, isLoading } = trpc.templates.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => utils.templates.list.invalidate(),
  });

  const { data: templateForEdit } = trpc.templates.getById.useQuery(
    { id: editTemplate! },
    { enabled: !!editTemplate }
  );

  function handleEdit(id: string) {
    setEditTemplate(id);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditTemplate(null);
  }

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Templates</h1>
            <p className="page-subtitle">
              Modelos de mensagem reutilizáveis com suporte a variáveis dinâmicas
            </p>
          </div>
          <button
            id="new-template-btn"
            className="btn-primary"
            onClick={() => { setEditTemplate(null); setShowModal(true); }}
          >
            + Novo template
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-row" style={{ height: "160px", borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      ) : !templates?.length ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <p style={{ color: "var(--text-muted)" }}>
            Nenhum template criado ainda. Clique em &ldquo;Novo template&rdquo; para começar.
          </p>
        </div>
      ) : (
        <div
          id="templates-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}
        >
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span className="channel-chip">
                    {channelIcons[tmpl.messageType as MessageType]} {tmpl.messageType}
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {formatDate(tmpl.createdAt)}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                  {tmpl.name}
                </h3>
                {tmpl.description && (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {tmpl.description}
                  </p>
                )}
              </div>

              {tmpl.subject && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-secondary)" }}>Assunto:</strong> {tmpl.subject}
                </p>
              )}

              <div
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.6rem 0.75rem",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  maxHeight: "60px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {tmpl.body}
              </div>

              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Usado em {(tmpl as { _count: { messages: number } })._count.messages} mensagem(ns)
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                <button
                  id={`edit-template-${tmpl.id}`}
                  className="btn-ghost"
                  style={{ flex: 1, fontSize: "0.8rem", padding: "0.45rem" }}
                  onClick={() => handleEdit(tmpl.id)}
                >
                  ✏️ Editar
                </button>
                <button
                  id={`delete-template-${tmpl.id}`}
                  className="btn-danger"
                  onClick={() => {
                    if (confirm(`Deletar template "${tmpl.name}"?`)) {
                      deleteMutation.mutate({ id: tmpl.id });
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editTemplate ? "Editar template" : "Novo template"}
              </h2>
              <button
                id="modal-close-btn"
                className="modal-close"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>
            <TemplateForm
              initialData={editTemplate && templateForEdit ? {
                id: templateForEdit.id,
                name: templateForEdit.name,
                description: templateForEdit.description,
                messageType: templateForEdit.messageType as MessageType,
                subject: templateForEdit.subject,
                body: templateForEdit.body,
              } : undefined}
              onSuccess={handleCloseModal}
            />
          </div>
        </div>
      )}
    </>
  );
}
