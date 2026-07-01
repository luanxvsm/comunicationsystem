"use client";
// src/components/StatusBadge.tsx
import type { MessageStatus } from "@/types";

interface StatusBadgeProps {
  status: MessageStatus;
}

const config: Record<MessageStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "badge badge-pending",
  },
  SENT: {
    label: "Enviado",
    className: "badge badge-sent",
  },
  FAILED: {
    label: "Falhou",
    className: "badge badge-failed",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = config[status] ?? config.PENDING;
  return (
    <span id={`status-badge-${status.toLowerCase()}`} className={className}>
      {label}
    </span>
  );
}
