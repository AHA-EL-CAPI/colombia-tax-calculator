import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Calculadora Retención en la Fuente 2026 | Art. 383 E.T.",
  description:
    "Calcula tu Retención en la Fuente según el Artículo 383 del Estatuto Tributario colombiano para 2026. Incluye diagnóstico de ahorro con AFC y pensiones voluntarias.",
  keywords: [
    "retención en la fuente",
    "Art. 383",
    "impuesto Colombia",
    "UVT 2026",
    "salario",
    "AFC",
    "pensión voluntaria",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
