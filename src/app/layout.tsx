import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SwrProvider } from "./swr-provider";
import { MocksProvider } from "./mocks-provider";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandPalette } from "@/components/command-palette";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LazyDev Dashboard",
  description: "Control plane UI for the Lazy Issue Resolver backend.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider>
          <MocksProvider>
            <SwrProvider>
              <ToastProvider>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <div className="flex flex-1 flex-col overflow-x-hidden">
                    <Topbar />
                    <main className="flex-1">
                      <ErrorBoundary>{children}</ErrorBoundary>
                    </main>
                  </div>
                </div>
                <CommandPalette />
              </ToastProvider>
            </SwrProvider>
          </MocksProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
