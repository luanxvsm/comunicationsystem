// src/server/services/sendEmail.ts
import sgMail from "@sendgrid/mail";
import type { Message } from "@/generated/prisma/client";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(message: Message): Promise<string | undefined> {
  const toEmail = message.email ?? message.to;

  if (!toEmail) {
    throw new Error("Destinatário de email não encontrado na mensagem.");
  }

  // Monta o HTML do corpo, embutindo a imagem caso exista
  const bodyHtml = message.body.replace(/\n/g, "<br/>");
  const imageHtml = message.imageUrl
    ? `<div style="margin-top:16px;text-align:center;">
        <img
          src="${message.imageUrl}"
          alt="Imagem anexada"
          style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0;"
        />
       </div>`
    : "";

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
      <p style="font-size:15px;line-height:1.7;">${bodyHtml}</p>
      ${imageHtml}
    </div>
  `;

  const [response] = await sgMail.send({
    to: toEmail,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: message.subject ?? "(sem assunto)",
    text: message.body,
    html,
  });

  // SendGrid retorna o message ID no header x-message-id
  return response?.headers?.["x-message-id"] as string | undefined;
}
