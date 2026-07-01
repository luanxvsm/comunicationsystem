// src/server/services/sendWhatsapp.ts
import twilio from "twilio";
import type { Message } from "@/generated/prisma/client";

let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return client;
}

export async function sendWhatsapp(message: Message): Promise<void> {
  const toPhone = message.phone ?? message.to;

  if (!toPhone) {
    throw new Error("Número de telefone não encontrado na mensagem.");
  }

  // Formata o número no padrão WhatsApp do Twilio
  const formattedTo = toPhone.startsWith("whatsapp:")
    ? toPhone
    : `whatsapp:${toPhone}`;

  await getTwilioClient().messages.create({
    body: message.body,
    from: process.env.TWILIO_WHATSAPP_NUMBER!,
    to: formattedTo,
  });
}
