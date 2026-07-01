// src/server/services/sendSms.ts
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

export async function sendSms(message: Message): Promise<void> {
  const toPhone = message.phone ?? message.to;

  if (!toPhone) {
    throw new Error("Número de telefone não encontrado na mensagem.");
  }

  await getTwilioClient().messages.create({
    body: message.body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: toPhone,
  });
}
