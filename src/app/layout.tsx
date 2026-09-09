import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SwrProvider } from "./swr-provider";
import { MocksProvider } from "./mocks-provider";
import { DashboardDataProvider } from "./dashboard-data-provider";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { CommandPalette } from "@/components/command-palette";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error-boundary";

// Outfit — soft, rounded, friendly geometric sans. Matches the cozy-core vibe.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "LazyDev™ Dashboard",
  description: "Control-plane UI for LazyDev™ — the AI-native autonomous CI assistant that monitors GitHub issues, generates validated code fixes, and opens pull requests. Built by FutureMindsDev.",
  authors: [
    { name: "Arkar Chan Myae", url: "https://github.com/arkar-chanmyae" },
    { name: "Khin Me Me Latt", url: "https://github.com/KhinMeMeLatt" },
  ],
  creator: "FutureMindsDev",
  publisher: "FutureMindsDev",
  keywords: ["LazyDev", "AI", "CI", "autonomous", "issue resolver", "LangGraph", "FutureMindsDev"],
  openGraph: {
    title: "LazyDev™ Dashboard",
    description: "Control-plane UI for the LazyDev autonomous CI assistant. Built by FutureMindsDev.",
    type: "website",
    images: [
      {
        url: "/lazydev-hero.jpeg",
        width: 2752,
        height: 1536,
        alt: "A developer sleeping peacefully on a bed next to a laptop that is running code during the day.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LazyDev™ Dashboard",
    description: "Control-plane UI for the LazyDev autonomous CI assistant. Built by FutureMindsDev.",
    images: ["/lazydev-hero.jpeg"],
    creator: "@FutureMindsDev",
  },
};

// Inline script runs before paint to set the correct theme class, preventing FOUC.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('lazydev-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <MocksProvider>
            <SwrProvider>
              <DashboardDataProvider>
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
              </DashboardDataProvider>
            </SwrProvider>
          </MocksProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
