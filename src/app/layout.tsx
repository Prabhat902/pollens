import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuraGen - YouTube Thumbnail Generator",
  description: "AI-powered YouTube thumbnail generator for high CTR thumbnails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {/* Animated Cyberpunk Background */}
        <div className="bg-mesh" />
        <div className="bg-orb-1" />
        <div className="bg-orb-2" />
        
        <div className="relative z-0">
          {children}
        </div>
      </body>
    </html>
  );
}
