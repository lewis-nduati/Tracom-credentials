import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { TRPCReactProvider } from "~/trpc/react";
import { MeshProvider } from "~/components/providers/mesh-provider";
import { AuthProvider } from "~/components/providers/auth-provider";
import { TxWatcherBridge } from "~/components/providers/tx-watcher-provider";
import { Toaster } from "~/components/ui/sonner";
import { BRANDING } from "~/config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: BRANDING.fullTitle,
  description: BRANDING.description,
  icons: [{ rel: "icon", url: BRANDING.logo.favicon }],
  openGraph: {
    title: BRANDING.fullTitle,
    description: BRANDING.description,
    images: [BRANDING.logo.ogImage],
    siteName: BRANDING.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRANDING.fullTitle,
    description: BRANDING.description,
    images: [BRANDING.logo.ogImage],
  },
  metadataBase: new URL(BRANDING.links.website),
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} overflow-hidden overscroll-none`} suppressHydrationWarning>
      <body className="font-sans overflow-hidden overscroll-none">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MeshProvider>
            <AuthProvider>
              <TRPCReactProvider>
                <TxWatcherBridge>
                  {children}
                </TxWatcherBridge>
              </TRPCReactProvider>
              <Toaster position="top-right" richColors closeButton />
            </AuthProvider>
          </MeshProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
