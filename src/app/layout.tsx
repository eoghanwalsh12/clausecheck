import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { FileText } from "lucide-react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ClauseCheck — AI Legal Assistant",
  description:
    "Open any legal document and chat with your AI legal assistant. Get risk assessments, negotiate better terms, and understand every clause.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-full items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <FileText className="h-5 w-5" />
              ClauseCheck
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/workspace"
                className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                Open Document
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
