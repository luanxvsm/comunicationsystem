// src/server/services/sendWhatsapp.ts
import twilio from "twilio";
import type { Message } from "@/generated/prisma/client";

/** Cria cliente sem cache para sempre usar as vars de ambiente atuais */
function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

/** Garante que o número tenha o prefixo whatsapp: e o formato +DDDXXXXXXXX */
function normalizeWhatsappPhone(phone: string): string {
  const stripped = phone.replace("whatsapp:", "").replace(/\s+/g, "");
  const e164 = stripped.startsWith("+") ? stripped : `+${stripped}`;
  return `whatsapp:${e164}`;
}

export async function sendWhatsapp(message: Message): Promise<string | undefined> {
  const rawPhone = message.phone ?? message.to;

  if (!rawPhone) {
    throw new Error("Número de telefone não encontrado na mensagem.");
  }

  const formattedTo = normalizeWhatsappPhone(rawPhone);

  try {
    const result = await getTwilioClient().messages.create({
      body: message.body,
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: formattedTo,
      // Passa a imagem como mediaUrl se existir (Twilio suporta mídia no WhatsApp)
      ...(message.imageUrl ? { mediaUrl: [message.imageUrl] } : {}),
    });
    return result.sid;
  } catch (err: unknown) {
    // Extrai detalhes específicos do erro do Twilio
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      const twilioErr = err as { code: number; message: string; moreInfo?: string };
      throw new Error(
        `Twilio WhatsApp Error ${twilioErr.code}: ${twilioErr.message}` +
          (twilioErr.moreInfo ? ` — Mais info: ${twilioErr.moreInfo}` : "")
      );
    }
    throw err;
  }
}
