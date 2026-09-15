import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Climate Extreme Predictor",
  description: "Multimodal AI Prediction Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden relative">
              <Header />
              <main className="flex-1 overflow-y-auto bg-muted/20 p-6 flex flex-col">
                <div className="flex-1">
                  {children}
                </div>
                <Footer />
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
