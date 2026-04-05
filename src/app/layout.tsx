import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "AgentForge — Crea tu agente de IA profesional",
  description: "Plataforma para crear y compartir agentes de IA personalizados con tu conocimiento profesional.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
