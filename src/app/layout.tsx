import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SwrProvider } from "./swr-provider";
import { MocksProvider } from "./mocks-provider";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

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
      <body className="min-h-full bg-background text-foreground">
        <MocksProvider>
          <SwrProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 overflow-x-hidden">{children}</main>
            </div>
            <CommandPalette />
          </SwrProvider>
        </MocksProvider>
      </body>
    </html>
  );
}
