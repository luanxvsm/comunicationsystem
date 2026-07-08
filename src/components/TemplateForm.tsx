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
    imageUrl?: string | null;
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
    imageUrl: initialData?.imageUrl ?? "",
  });

  const [imageError, setImageError] = useState(false);

  // Detecta variáveis no assunto e no corpo em tempo real
  const detectedVariables = Array.from(
    new Set(
      [
        ...(form.messageType === "EMAIL" && form.subject ? Array.from(form.subject.matchAll(/\{\{(\w+)\}\}/g)) : []),
        ...Array.from(form.body.matchAll(/\{\{(\w+)\}\}/g))
      ].map((m) => m[1])
    )
  );

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

  // Canais que suportam imagem
  const supportsImage =
    form.messageType === "EMAIL" ||
    form.messageType === "WHATSAPP" ||
    form.messageType === "SMS";

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Nome é obrigatório";
    if (!form.body.trim()) newErrors.body = "Corpo é obrigatório";
    if (form.imageUrl.trim()) {
      try {
        new URL(form.imageUrl.trim());
      } catch {
        newErrors.imageUrl = "URL de imagem inválida";
      }
    }
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
      imageUrl: form.imageUrl.trim() || undefined,
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
          onChange={(e) => {
            setForm({ ...form, messageType: e.target.value as MessageType, imageUrl: "" });
            setImageError(false);
          }}
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
        {detectedVariables.length > 0 ? (
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginRight: "0.15rem" }}>Variáveis detectadas:</span>
            {detectedVariables.map((v) => (
              <span
                key={v}
                style={{
                  fontSize: "0.7rem",
                  background: "var(--accent-primary-glow)",
                  color: "var(--accent-primary)",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "var(--radius-sm, 4px)",
                  border: "1px solid var(--border-subtle)",
                  fontWeight: 600
                }}
              >
                {v}
              </span>
            ))}
          </div>
        ) : (
          <p className="form-hint">
            Use {"{{variavel}}"} para campos dinâmicos.
          </p>
        )}
        {errors.body && <p className="form-error">{errors.body}</p>}
      </div>

      {/* Campo de imagem — visível apenas para canais que suportam */}
      {supportsImage && (
        <div className="form-group">
          <label htmlFor="template-image-url" className="form-label">
            🖼️ URL da Imagem{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(opcional)</span>
          </label>
          <input
            id="template-image-url"
            type="url"
            className={`form-input ${errors.imageUrl ? "form-input-error" : ""}`}
            placeholder="https://exemplo.com/imagem.jpg"
            value={form.imageUrl}
            onChange={(e) => {
              setForm({ ...form, imageUrl: e.target.value });
              setImageError(false);
              if (errors.imageUrl) {
                const updated = { ...errors };
                delete updated.imageUrl;
                setErrors(updated);
              }
            }}
          />
          {errors.imageUrl && <p className="form-error">{errors.imageUrl}</p>}

          {/* Preview inline da imagem */}
          {form.imageUrl.trim() && !errors.imageUrl && (
            <div className="image-preview-box">
              {imageError ? (
                <div className="image-preview-error">
                  ⚠️ Não foi possível carregar a imagem. Verifique a URL.
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="Preview da imagem"
                  className="image-preview-img"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              )}
            </div>
          )}
          <p className="form-hint">
            {form.messageType === "EMAIL" && "A imagem será embutida no corpo do e-mail."}
            {form.messageType === "WHATSAPP" && "A imagem será enviada como mídia pelo WhatsApp (Twilio)."}
            {form.messageType === "SMS" && "A imagem será enviada como MMS (suporte limitado fora dos EUA)."}
          </p>
        </div>
      )}

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
