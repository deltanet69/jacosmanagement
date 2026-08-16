import type { Metadata } from "next";
import { Baloo_2, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "JACOS — Online Admission",
  description: "Jakarta Cosmopolite Islamic School Online Admission",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html
      lang="id"
      className={`${baloo.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-cloud text-ink">{children}</body>
    </html>
  );
}
