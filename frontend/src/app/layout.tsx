import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

const ui = Source_Sans_3({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const display = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Zigba — evidence-based professional network",
  description:
    "A professional network where candidates show projects with proof and employers are verified before they post jobs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ui.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
