// src/app/api/webhook/route.ts
import { type NextRequest } from "next/server";
import { db } from "@/server/db";
import { messageDispatcher } from "@/server/services/messageDispatcher";
import { validateWebhookSignature } from "@/lib/webhookValidator";
import { renderTemplate } from "@/lib/templateEngine";
import type { WebhookPayload } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Lê o corpo cru para validar a assinatura
  const rawBody = await request.text();

  // Validação de assinatura (opcional mas recomendado em produção)
  const secret = process.env.WEBHOOK_SECRET;
  const signature = request.headers.get("x-webhook-signature");

  if (secret && signature) {
    const isValid = validateWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Assinatura inválida" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: "Payload inválido (JSON malformado)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Valida campos obrigatórios
  if (!payload.from || !payload.to || !payload.messageType) {
    return new Response(
      JSON.stringify({ error: "Campos obrigatórios: from, to, messageType" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    let body = payload.body ?? "";
    let subject = payload.subject;

    // Se um templateId foi enviado, busca o template e renderiza
    if (payload.templateId) {
      const template = await db.template.findUnique({
        where: { id: payload.templateId },
      });

      if (template) {
        body = renderTemplate(template.body, payload.variables ?? {});
        subject = subject ?? (template.subject
          ? renderTemplate(template.subject, payload.variables ?? {})
          : undefined);
      }
    }

    // Salva a mensagem no banco com status PENDING
    const message = await db.message.create({
      data: {
        from: payload.from,
        to: payload.to,
        subject,
        body,
        imageUrl: payload.imageUrl,
        email: payload.email,
        phone: payload.phone,
        messageType: payload.messageType,
        status: "PENDING",
        contactId: payload.contactId,
        templateId: payload.templateId,
      },
    });

    // Despacha a mensagem para o canal correto (não bloqueia a resposta)
    messageDispatcher(message.id).catch((err) => {
      console.error(`[Dispatcher] Erro ao enviar mensagem ${message.id}:`, err);
    });

    return new Response(
      JSON.stringify({ success: true, messageId: message.id }),
      { status: 202, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Webhook] Erro interno:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
