import type { Metadata } from "next";
import "./globals.css";
import { RevealScript } from "@/components/reveal";
import { cn } from "@/lib/utils";
import { geistMono, geistSans, instrumentSerif } from "@/fonts";

export const metadata: Metadata = {
  title: "Kael Neurology",
  description: "A style preview for Kael Neurology.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The reveal script adds `.reveal` before hydration (ADR 0005).
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        instrumentSerif.variable,
      )}>
      <body className="min-h-full flex flex-col">
        {children}
        <RevealScript />
      </body>
    </html>
  );
}
