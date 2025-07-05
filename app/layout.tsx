import type { Metadata } from "next";
import { Kumbh_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const kumbhSans = Kumbh_Sans({ subsets: ["latin"], weight: ['400', '500', '600', '700', '800'] });

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
      <body className={`${kumbhSans.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
