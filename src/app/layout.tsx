// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/components/TRPCProvider";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Sistema de Comunicação Multi-Canal",
  description:
    "Plataforma para receber notificações via webhook e distribuir mensagens por Email, SMS, WhatsApp e Push com rastreamento de status.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body>
        <ThemeProvider>
          <TRPCProvider>
            <div className="app-shell">
              <Sidebar />
              <main className="main-content">{children}</main>
            </div>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
