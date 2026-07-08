// src/server/routers/templates.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

const templateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  messageType: z.enum(["EMAIL", "SMS", "WHATSAPP", "PUSH"]),
  subject: z.string().optional(),
  body: z.string().min(1, "Corpo é obrigatório"),
  imageUrl: z.string().url("URL de imagem inválida").optional(),
});

export const templatesRouter = createTRPCRouter({
  /**
   * Lista todos os templates.
   */
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.template.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { messages: true } },
      },
    });
  }),

  /**
   * Busca um template específico por ID.
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.template.findUniqueOrThrow({
        where: { id: input.id },
      });
    }),

  /**
   * Cria um novo template.
   */
  create: publicProcedure
    .input(templateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.template.create({ data: input });
    }),

  /**
   * Atualiza um template existente.
   */
  update: publicProcedure
    .input(z.object({ id: z.string() }).merge(templateSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.template.update({ where: { id }, data });
    }),

  /**
   * Remove um template.
   */
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.template.delete({ where: { id: input.id } });
    }),
});
