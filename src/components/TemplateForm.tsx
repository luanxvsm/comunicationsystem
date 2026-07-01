"use client";
// src/components/TemplateForm.tsx
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { MessageType } from "@/types";

interface TemplateFormProps {
  onSuccess?: () => void;
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    messageType: MessageType;
    subject?: string | null;
    body: string;
  };
}

const messageTypeOptions: { value: MessageType; label: string }[] = [
  { value: "EMAIL", label: "✉️ Email" },
  { value: "SMS", label: "💬 SMS" },
  { value: "WHATSAPP", label: "📱 WhatsApp" },
  { value: "PUSH", label: "🔔 Push" },
];

export function TemplateForm({ onSuccess, initialData }: TemplateFormProps) {
  const isEdit = !!initialData;
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    messageType: (initialData?.messageType ?? "EMAIL") as MessageType,
    subject: initialData?.subject ?? "",
    body: initialData?.body ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      onSuccess?.();
    },
  });

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      onSuccess?.();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!form.body.trim()) newErrors.body = "Corpo é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      name: form.name,
      description: form.description || undefined,
      messageType: form.messageType,
      subject: form.subject || undefined,
      body: form.body,
    };

    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <form
      id="template-form"
      onSubmit={handleSubmit}
      className="template-form"
      noValidate
    >
      <div className="form-group">
        <label htmlFor="template-name" className="form-label">
          Nome do template
        </label>
        <input
          id="template-name"
          type="text"
          className={`form-input ${errors.name ? "form-input-error" : ""}`}
          placeholder="Ex: Boas-vindas cliente"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="template-description" className="form-label">
          Descrição (opcional)
        </label>
        <input
          id="template-description"
          type="text"
          className="form-input"
          placeholder="Ex: Enviado quando um cliente se cadastra"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label htmlFor="template-type" className="form-label">
          Canal de envio
        </label>
        <select
          id="template-type"
          className="form-select"
          value={form.messageType}
          onChange={(e) =>
            setForm({ ...form, messageType: e.target.value as MessageType })
          }
        >
          {messageTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {form.messageType === "EMAIL" && (
        <div className="form-group">
          <label htmlFor="template-subject" className="form-label">
            Assunto (opcional)
          </label>
          <input
            id="template-subject"
            type="text"
            className="form-input"
            placeholder="Ex: Bem-vindo, {{nome}}!"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="template-body" className="form-label">
          Corpo da mensagem
        </label>
        <textarea
          id="template-body"
          rows={5}
          className={`form-textarea ${errors.body ? "form-input-error" : ""}`}
          placeholder="Ex: Olá, {{nome}}! Seu acesso foi criado com sucesso."
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <p className="form-hint">
          Use {"{{variavel}}"} para campos dinâmicos.
        </p>
        {errors.body && <p className="form-error">{errors.body}</p>}
      </div>

      {(createMutation.error || updateMutation.error) && (
        <div className="form-server-error">
          ❌ {createMutation.error?.message ?? updateMutation.error?.message}
        </div>
      )}

      <button
        id="template-submit-btn"
        type="submit"
        className="btn-primary"
        disabled={isPending}
      >
        {isPending ? "Salvando…" : isEdit ? "Atualizar template" : "Criar template"}
      </button>
    </form>
  );
}
