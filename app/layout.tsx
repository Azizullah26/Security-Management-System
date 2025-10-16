import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress ResizeObserver loop errors (harmless browser quirk)
              // Method 1: window.onerror handler
              const originalOnError = window.onerror;
              window.onerror = function(message, source, lineno, colno, error) {
                if (typeof message === 'string' && message.includes('ResizeObserver')) {
                  return true; // Suppress the error
                }
                if (originalOnError) {
                  return originalOnError(message, source, lineno, colno, error);
                }
                return false;
              };

              // Method 2: addEventListener for 'error' events
              window.addEventListener('error', (e) => {
                if (e.message && e.message.includes('ResizeObserver')) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  return true;
                }
              }, true);

              // Method 3: Catch unhandled promise rejections
              window.addEventListener('unhandledrejection', (e) => {
                if (e.reason && e.reason.message && e.reason.message.includes('ResizeObserver')) {
                  e.preventDefault();
                  return true;
                }
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
