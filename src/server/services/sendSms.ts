// src/server/services/sendSms.ts
import twilio from "twilio";
import type { Message } from "@/generated/prisma/client";

/** Cria cliente sem cache para sempre usar as vars de ambiente atuais */
function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

/** Normaliza o número para o formato E.164 esperado pelo Twilio */
function normalizePhone(phone: string): string {
  const stripped = phone.replace(/\s+/g, "");
  return stripped.startsWith("+") ? stripped : `+${stripped}`;
}

export async function sendSms(message: Message): Promise<string | undefined> {
  const rawPhone = message.phone ?? message.to;

  if (!rawPhone) {
    throw new Error("Número de telefone não encontrado na mensagem.");
  }

  const toPhone = normalizePhone(rawPhone);

  try {
    const result = await getTwilioClient().messages.create({
      body: message.body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: toPhone,
    });
    return result.sid;
  } catch (err: unknown) {
    // Extrai detalhes específicos do erro do Twilio
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      const twilioErr = err as { code: number; message: string; moreInfo?: string };
      throw new Error(
        `Twilio SMS Error ${twilioErr.code}: ${twilioErr.message}` +
        (twilioErr.moreInfo ? ` — Mais info: ${twilioErr.moreInfo}` : "")
      );
    }
    throw err;
  }
}
