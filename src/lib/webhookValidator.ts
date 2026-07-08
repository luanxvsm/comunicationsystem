// src/lib/webhookValidator.ts
import crypto from "crypto";

/**
 * Valida a assinatura HMAC-SHA256 de um webhook.
 * O sistema externo deve enviar o header x-webhook-signature com o HMAC do payload.
 *
 * @param payload - O corpo cru (raw text) do request
 * @param signature - O valor do header x-webhook-signature
 * @param secret - O WEBHOOK_SECRET definido no .env
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");

    // timingSafeEqual exige buffers do mesmo tamanho; compara comprimentos primeiro
    if (expectedBuf.length !== signatureBuf.length) return false;

    // timingSafeEqual previne timing attacks
    return crypto.timingSafeEqual(signatureBuf, expectedBuf);
  } catch {
    return false;
  }
}
