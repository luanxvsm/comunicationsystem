// src/server/services/sendEmail.ts
import sgMail from "@sendgrid/mail";
import type { Message } from "@/generated/prisma/client";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(message: Message): Promise<string | undefined> {
  const toEmail = message.email ?? message.to;

  if (!toEmail) {
    throw new Error("Destinatário de email não encontrado na mensagem.");
  }

  const [response] = await sgMail.send({
    to: toEmail,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: message.subject ?? "(sem assunto)",
    text: message.body,
    html: `<p>${message.body.replace(/\n/g, "<br/>")}</p>`,
  });

  // SendGrid retorna o message ID no header x-message-id
  return response?.headers?.["x-message-id"] as string | undefined;
}
