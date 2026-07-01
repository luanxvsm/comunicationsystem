// src/server/services/messageDispatcher.ts
import { MessageType } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { sendEmail } from "./sendEmail";
import { sendSms } from "./sendSms";
import { sendWhatsapp } from "./sendWhatsapp";

/**
 * Busca a mensagem no banco pelo ID e despacha para o canal correto.
 * Atualiza o status para SENT ou FAILED conforme o resultado.
 */
export async function messageDispatcher(messageId: string): Promise<void> {
  const message = await db.message.findUniqueOrThrow({
    where: { id: messageId },
  });

  try {
    switch (message.messageType) {
      case MessageType.EMAIL:
        await sendEmail(message);
        break;
      case MessageType.SMS:
        await sendSms(message);
        break;
      case MessageType.WHATSAPP:
        await sendWhatsapp(message);
        break;
      default:
        throw new Error(`Canal não suportado: ${message.messageType}`);
    }

    await db.message.update({
      where: { id: messageId },
      data: { status: "SENT", sentAt: new Date() },
    });
  } catch (error) {
    await db.message.update({
      where: { id: messageId },
      data: { status: "FAILED", error: String(error) },
    });
    throw error;
  }
}
