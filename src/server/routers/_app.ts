// src/server/routers/_app.ts
import { createTRPCRouter } from "@/server/trpc";
import { messagesRouter } from "./messages";
import { templatesRouter } from "./templates";

export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  templates: templatesRouter,
});

export type AppRouter = typeof appRouter;
