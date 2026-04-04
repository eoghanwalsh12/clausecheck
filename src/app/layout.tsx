import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/lib/auth-context";
import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";
import BackgroundBlobs from "@/components/background-blobs";
import CookieBanner from "@/components/cookie-banner";
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
        <AuthProvider>
          <BackgroundBlobs />
          <NavBar />
          <main>{children}</main>
          <Footer />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
