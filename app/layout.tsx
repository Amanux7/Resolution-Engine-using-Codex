import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Resolution Engine — Turn scattered evidence into a case", description: "Resolution Engine helps organize documents, screenshots, receipts and messages into an evidence-backed case with a clear next step." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
    {/* App Router root layout is the document-level font loading boundary. */}
    {/* eslint-disable-next-line @next/next/no-page-custom-font */}
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600;1,700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  </head><body>{children}</body></html>;
}

