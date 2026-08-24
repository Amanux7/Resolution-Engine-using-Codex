import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Resolution Engine", description: "Turn a messy problem into a case you can act on." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
