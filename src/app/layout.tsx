import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Mascot from "@/components/layout/Mascot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YNM Safety Portal",
  description: "YNM Safety Purchase Portal - Purchase Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Mascot />
          <main className="flex-1">
            {children}
          </main>
          {/* Footer Watermark */}
          <footer className="w-full py-3 text-center bg-gradient-to-r from-maroon/5 via-transparent to-maroon/5 border-t border-maroon/10">
            <p className="text-xs text-text-muted/70 font-medium tracking-wide">
              Created by <span className="text-maroon font-semibold">Om Gupta</span>
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
