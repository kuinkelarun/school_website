import type { Metadata } from "next";
import { getLocale } from 'next-intl/server';
import "./globals.css";

export const metadata: Metadata = {
  title: "Janata Sec. School",
  description: "Quality education for a brighter future",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
