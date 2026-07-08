"use client";
// src/components/NotificationForm.tsx
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { renderTemplate } from "@/lib/templateEngine";
import type { MessageType } from "@/types";

interface NotificationFormProps {
  onSuccess?: () => void;
}

export function NotificationForm({ onSuccess }: NotificationFormProps) {
  const utils = trpc.useUtils();
  const { data: templates } = trpc.templates.list.useQuery();

  const [messageType, setMessageType] = useState<MessageType>("EMAIL");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Estado dos templates
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [variableKeys, setVariableKeys] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      utils.messages.list.invalidate();
      utils.messages.stats.invalidate();
      onSuccess?.();
    },
  });

  // Filtra templates pelo tipo de canal selecionado
  const filteredTemplates = templates?.filter((t) => t.messageType === messageType) ?? [];

  // Detecta variáveis no template quando ele é selecionado
  useEffect(() => {
    if (!selectedTemplateId) {
      setVariableKeys([]);
      setTemplateVariables({});
      return;
    }

    const template = templates?.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    // Se for e-mail, junta assunto e corpo para buscar variáveis
    const sourceText = `${template.subject ?? ""} ${template.body}`;
    const matches = Array.from(sourceText.matchAll(/\{\{(\w+)\}\}/g));
    const uniqueKeys = Array.from(new Set(matches.map((m) => m[1])));

    setVariableKeys(uniqueKeys);
    
    // Inicializa valores vazios para as variáveis
    const initialVars: Record<string, string> = {};
    uniqueKeys.forEach((key) => {
      initialVars[key] = "";
    });
    setTemplateVariables(initialVars);
  }, [selectedTemplateId, templates]);

  // Atualiza dinamicamente o preview do assunto e corpo
  const template = templates?.find((t) => t.id === selectedTemplateId);
  const previewSubject = template?.subject
    ? renderTemplate(template.subject, templateVariables)
    : subject;
  const previewBody = template?.body
    ? renderTemplate(template.body, templateVariables)
    : body;

  // Estado dos erros de variáveis específicas
  function validate() {
    const newErrors: Record<string, string> = {};
    if (!to.trim()) {
      newErrors.to = "Destinatário é obrigatório";
    } else if (messageType === "EMAIL" && !/\S+@\S+\.\S+/.test(to)) {
      newErrors.to = "E-mail inválido";
    }
    
    if (!selectedTemplateId) {
      if (messageType === "EMAIL" && !subject.trim()) {
        newErrors.subject = "Assunto é obrigatório para e-mail";
      }
      if (!body.trim()) {
        newErrors.body = "Mensagem é obrigatória";
      }
    } else {
      // Valida cada variável individualmente
      variableKeys.forEach((key) => {
        if (!templateVariables[key]?.trim()) {
          newErrors[`var-${key}`] = `Preenchimento de {{${key}}} é obrigatório`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    sendMutation.mutate({
      messageType,
      to,
      subject: selectedTemplateId ? previewSubject : (messageType === "EMAIL" ? subject : undefined),
      body: selectedTemplateId ? previewBody : body,
      templateId: selectedTemplateId || undefined,
    });
  }

  // Função para renderizar o preview dinâmico com realce de variáveis
  function renderRichPreview(text: string, vars: Record<string, string>) {
    if (!text) return null;
    
    const parts: React.ReactNode[] = [];
    const regex = /\{\{(\w+)\}\}/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const varName = match[1];
      const matchIndex = match.index;
      
      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }
      
      const val = vars[varName];
      if (val && val.trim() !== "") {
        parts.push(
          <span
            key={`preview-var-${matchIndex}`}
            style={{
              color: "#34d399", // Verde
              background: "rgba(52, 211, 153, 0.15)",
              padding: "0.1rem 0.35rem",
              borderRadius: "var(--radius-sm, 4px)",
              fontWeight: 600,
              border: "1px solid rgba(52, 211, 153, 0.3)",
              display: "inline-block",
            }}
          >
            {val}
          </span>
        );
      } else {
        parts.push(
          <span
            key={`preview-empty-${matchIndex}`}
            style={{
              color: "#f87171", // Vermelho
              background: "rgba(248, 113, 113, 0.15)",
              padding: "0.1rem 0.35rem",
              borderRadius: "var(--radius-sm, 4px)",
              fontWeight: 600,
              border: "1px dashed #f87171",
              display: "inline-block",
            }}
          >
            {`{{${varName}}}`}
          </span>
        );
      }
      
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return <>{parts}</>;
  }

  return (
    <form id="notification-form" onSubmit={handleSubmit} className="template-form">
      <div className="form-group">
        <label htmlFor="notif-type" className="form-label">Canal de Envio</label>
        <select
          id="notif-type"
          className="form-select"
          value={messageType}
          onChange={(e) => {
            setMessageType(e.target.value as MessageType);
            setSelectedTemplateId(""); // Reseta template ao mudar de canal
            setTo("");
            setSubject("");
            setBody("");
          }}
        >
          <option value="EMAIL">✉️ Email</option>
          <option value="SMS">💬 SMS</option>
          <option value="WHATSAPP">📱 WhatsApp</option>
          <option value="PUSH">🔔 Push Notification</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="notif-to" className="form-label">
          {messageType === "EMAIL" ? "E-mail do destinatário" : "Número de telefone"}
        </label>
        <input
          id="notif-to"
          type="text"
          className={`form-input ${errors.to ? "form-input-error" : ""}`}
          placeholder={messageType === "EMAIL" ? "ex: cliente@email.com" : "ex: +5511999999999"}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        {errors.to && <p className="form-error">{errors.to}</p>}
      </div>

      {filteredTemplates.length > 0 && (
        <div className="form-group">
          <label htmlFor="notif-template" className="form-label">Usar Template (Opcional)</label>
          <select
            id="notif-template"
            className="form-select"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            <option value="">-- Escrever mensagem manualmente --</option>
            {filteredTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Formulário Dinâmico de Variáveis se um Template for selecionado */}
      {selectedTemplateId && variableKeys.length > 0 && (
        <div className="card" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", padding: "1rem" }}>
          <p className="form-label" style={{ marginBottom: "0.75rem", fontSize: "0.8rem", color: "var(--accent-secondary)" }}>
            Variáveis do Template:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {variableKeys.map((key) => (
              <div key={key} className="form-group">
                <label htmlFor={`var-${key}`} className="form-label" style={{ fontSize: "0.75rem", textTransform: "capitalize" }}>
                  {key}
                </label>
                <input
                  id={`var-${key}`}
                  type="text"
                  className={`form-input ${errors[`var-${key}`] ? "form-input-error" : ""}`}
                  placeholder={`Valor para {{${key}}}`}
                  value={templateVariables[key] || ""}
                  onChange={(e) => {
                    setTemplateVariables({ ...templateVariables, [key]: e.target.value });
                    if (errors[`var-${key}`]) {
                      const updatedErrors = { ...errors };
                      delete updatedErrors[`var-${key}`];
                      setErrors(updatedErrors);
                    }
                  }}
                />
                {errors[`var-${key}`] && <p className="form-error">{errors[`var-${key}`]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inputs manuais (Escrever do zero) */}
      {!selectedTemplateId ? (
        <>
          {messageType === "EMAIL" && (
            <div className="form-group">
              <label htmlFor="notif-subject" className="form-label">Assunto</label>
              <input
                id="notif-subject"
                type="text"
                className={`form-input ${errors.subject ? "form-input-error" : ""}`}
                placeholder="Assunto da mensagem"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              {errors.subject && <p className="form-error">{errors.subject}</p>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="notif-body" className="form-label">Mensagem</label>
            <textarea
              id="notif-body"
              rows={4}
              className={`form-textarea ${errors.body ? "form-input-error" : ""}`}
              placeholder="Digite o texto da mensagem aqui..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {errors.body && <p className="form-error">{errors.body}</p>}
          </div>
        </>
      ) : (
        /* Preview de Envio do Template */
        <div className="card" style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px dashed var(--border-subtle)" }}>
          <p className="form-label" style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Visualização da mensagem a ser enviada:
          </p>
          {messageType === "EMAIL" && (
            <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Assunto:</span>{" "}
              {template?.subject ? renderRichPreview(template.subject, templateVariables) : previewSubject}
            </p>
          )}
          <div style={{ fontSize: "0.825rem", color: "var(--text-primary)", fontFamily: "monospace", whiteSpace: "pre-wrap", background: "var(--bg-base)", padding: "0.75rem", borderRadius: "var(--radius-sm)", lineHeight: "1.5" }}>
            {template?.body ? renderRichPreview(template.body, templateVariables) : previewBody}
          </div>
        </div>
      )}

      {sendMutation.error && (
        <div className="form-server-error">
          ❌ {sendMutation.error.message}
        </div>
      )}

      <button
        id="notif-submit-btn"
        type="submit"
        className="btn-primary"
        disabled={sendMutation.isPending}
      >
        {sendMutation.isPending ? "Processando..." : "Disparar Mensagem"}
      </button>
    </form>
  );
}
