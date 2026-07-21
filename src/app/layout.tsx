import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arena — Tic-Tac-Toe Multiplayer",
  description:
    "Real-time multiplayer Tic-Tac-Toe with ELO ranking. Sign up, verify your email, and climb the leaderboard.",
  keywords: ["tic-tac-toe", "multiplayer", "elo", "leaderboard", "real-time"],
  authors: [{ name: "Arena" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t py-4 mt-auto">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              Built with Next.js + Hono on Cloudflare Workers lot of determination and bit love
            </div>
          </footer>
          <Toaster />
          <SonnerToaster richColors position="top-right" theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
