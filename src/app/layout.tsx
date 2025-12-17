import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Ideas Wall - Share Your Innovation",
  description: "A modern platform for sharing AI app ideas without login. Join our community of innovators and discover the future of artificial intelligence.",
  keywords: ["AI ideas", "artificial intelligence", "innovation", "tech ideas", "AI apps", "machine learning", "creativity", "innovation platform"],
  authors: [{ name: "AI Ideas Wall Community" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AI Ideas Wall - Share Your Innovation",
    description: "Share your revolutionary AI ideas with our global community. No login required. Let's build the future together.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Ideas Wall - Share Your Innovation",
    description: "Share your revolutionary AI ideas with our global community. No login required.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
