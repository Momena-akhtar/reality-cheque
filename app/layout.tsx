import type { Metadata } from "next";
import { Kumbh_Sans } from "next/font/google";
import "./globals.css";

const kumbhSans = Kumbh_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MiniBots",
  description: "A multi-agent AI assistant hub featuring domain-specific bots for streamlined knowledge access using prompt prompt engineering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${kumbhSans.className} antialiased`}>{children}</body>
    </html>
  );
}
