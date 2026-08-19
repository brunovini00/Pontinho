import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pontinho — Placar da Mesa",
  description: "Placar mobile para partidas de Pontinho com amigos.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
