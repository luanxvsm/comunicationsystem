"use client";
// src/components/MessageTable.tsx
import { StatusBadge } from "./StatusBadge";
import type { MessageType } from "@/types";

interface Message {
  id: string;
  from: string;
  to: string;
  subject?: string | null;
  body: string;
  messageType: MessageType;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt?: Date | null;
  createdAt: Date;
  contact?: { id: string; name: string } | null;
}

interface MessageTableProps {
  messages: Message[];
  isLoading?: boolean;
}

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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function MessageTable({ messages, isLoading }: MessageTableProps) {
  if (isLoading) {
    return (
      <div className="table-loading">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="table-empty">
        <div className="table-empty-icon">📭</div>
        <p>Nenhuma mensagem encontrada.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table" id="messages-table">
        <thead>
          <tr>
            <th>Canal</th>
            <th>De</th>
            <th>Para</th>
            <th>Assunto / Corpo</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg.id} className="table-row">
              <td>
                <span className="channel-icon" title={msg.messageType}>
                  {channelIcons[msg.messageType]}
                </span>
              </td>
              <td className="text-muted">{msg.from}</td>
              <td>
                {msg.contact ? (
                  <span title={msg.to} className="contact-name">
                    {msg.contact.name}
                  </span>
                ) : (
                  msg.to
                )}
              </td>
              <td className="message-preview">
                {msg.subject ? (
                  <span className="subject">{msg.subject}</span>
                ) : (
                  <span className="body-preview">
                    {msg.body.slice(0, 60)}
                    {msg.body.length > 60 ? "…" : ""}
                  </span>
                )}
              </td>
              <td>
                <StatusBadge status={msg.status} />
              </td>
              <td className="text-muted text-sm">{formatDate(msg.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
