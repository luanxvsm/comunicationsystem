"use client";
// src/app/messages/page.tsx
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { MessageTable } from "@/components/MessageTable";
import type { MessageType, MessageStatus } from "@/types";

type StatusFilter = MessageStatus | "ALL";
type TypeFilter = MessageType | "ALL";

export default function MessagesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.messages.list.useInfiniteQuery(
      {
        limit: 20,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        messageType: typeFilter !== "ALL" ? typeFilter : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialCursor: undefined,
      }
    );

  const messages = data?.pages.flatMap((p) => p.messages) ?? [];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "Todos" },
    { value: "PENDING", label: "⏳ Pendente" },
    { value: "SENT", label: "✅ Enviado" },
    { value: "FAILED", label: "❌ Falhou" },
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "ALL", label: "Todos canais" },
    { value: "EMAIL", label: "✉️ Email" },
    { value: "SMS", label: "💬 SMS" },
    { value: "WHATSAPP", label: "📱 WhatsApp" },
    { value: "PUSH", label: "🔔 Push" },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Mensagens</h1>
        <p className="page-subtitle">
          Histórico completo de todas as mensagens enviadas
        </p>
      </div>

      {/* Filtros de status */}
      <div className="filter-bar" id="filter-status-bar">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            id={`filter-status-${opt.value.toLowerCase()}`}
            className={`filter-chip ${statusFilter === opt.value ? "active" : ""}`}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filtros de canal */}
      <div className="filter-bar" id="filter-type-bar">
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            id={`filter-type-${opt.value.toLowerCase()}`}
            className={`filter-chip ${typeFilter === opt.value ? "active" : ""}`}
            onClick={() => setTypeFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <MessageTable messages={messages} isLoading={isLoading} />

        {hasNextPage && (
          <div style={{ padding: "1rem", textAlign: "center", borderTop: "1px solid var(--border-card)" }}>
            <button
              id="load-more-btn"
              className="btn-ghost"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
