// src/server/routers/messages.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

export const messagesRouter = createTRPCRouter({
  /**
   * Lista todas as mensagens, ordenadas por data de criação (mais recentes primeiro).
   */
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
          status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
          messageType: z
            .enum(["EMAIL", "SMS", "WHATSAPP", "PUSH"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const cursor = input?.cursor;

      const messages = await ctx.db.message.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.messageType ? { messageType: input.messageType } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          contact: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return { messages, nextCursor };
    }),

  /**
   * Busca uma mensagem específica por ID.
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.message.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          contact: true,
          template: true,
        },
      });
    }),

  /**
   * Retorna estatísticas rápidas para o dashboard.
   */
  stats: publicProcedure.query(async ({ ctx }) => {
    const [total, sent, failed, pending] = await Promise.all([
      ctx.db.message.count(),
      ctx.db.message.count({ where: { status: "SENT" } }),
      ctx.db.message.count({ where: { status: "FAILED" } }),
      ctx.db.message.count({ where: { status: "PENDING" } }),
    ]);

    const byType = await ctx.db.message.groupBy({
      by: ["messageType"],
      _count: { id: true },
    });

    return { total, sent, failed, pending, byType };
  }),
});
