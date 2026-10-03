import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BELENTANI // FIRELAB — Local-first Generative Creative Studio",
  description:
    "A modular, local-first generative creative studio. Canvas editor, masks, generative fill, remove & replace, background tools, upscaling and variations — with an interchangeable AI provider architecture (built-in engine, Ollama, ComfyUI, Qwen, NVIDIA, Hugging Face). Cloud is optional. Local is first.",
  keywords: [
    "generative studio",
    "local-first",
    "AI image editing",
    "generative fill",
    "background removal",
    "open source",
    "Adobe Firefly alternative",
  ],
  authors: [{ name: "BELENTANI" }],
  icons: {
    icon: "/firelab-mark.png",
    apple: "/firelab-mark.png",
  },
  openGraph: {
    title: "BELENTANI // FIRELAB",
    description: "Local-first generative creative studio. Cloud is optional. Local is first.",
    siteName: "BELENTANI FIRELAB",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
