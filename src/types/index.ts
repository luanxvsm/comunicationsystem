// src/types/index.ts

export type MessageType = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
export type MessageStatus = "PENDING" | "SENT" | "FAILED";

export interface MessagePayload {
  from: string;
  to: string;
  subject?: string;
  body: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  messageType: MessageType;
  contactId?: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface WebhookPayload {
  from: string;
  to: string;
  subject?: string;
  body?: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  messageType: MessageType;
  contactId?: string;
  templateId?: string;
  variables?: Record<string, string>;
}
