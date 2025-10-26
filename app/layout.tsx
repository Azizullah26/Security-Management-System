import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: {
    default: "Elrace Security Management System",
    template: "%s | Elrace Security",
  },
  description:
    "Elrace Security Management System - Comprehensive security staff management, project tracking, and access control for Elrace Contracting & General Construction Company. Manage security personnel, monitor site access, and track project assignments efficiently.",
  keywords: [
    "Elrace Security",
    "Security Management",
    "Staff Management",
    "Access Control",
    "Project Management",
    "Construction Security",
    "RCC Security",
    "El Race Contracting",
  ],
  authors: [{ name: "Elrace Contracting & General Construction Company" }],
  creator: "Elrace Security",
  publisher: "Elrace Contracting & General Construction Company",
  applicationName: "Elrace Security Management System",
  generator: "Next.js",
  icons: {
    icon: "/images/design-mode/2025%20LOGO(1).jpeg",
    apple: "/images/design-mode/2025%20LOGO(1).jpeg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Elrace Security Management System",
    description:
      "Comprehensive security staff management, project tracking, and access control for Elrace Contracting & General Construction Company.",
    siteName: "Elrace Security",
    images: [
      {
        url: "/images/design-mode/2025%20LOGO(1).jpeg",
        width: 1200,
        height: 630,
        alt: "Elrace Security Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elrace Security Management System",
    description:
      "Comprehensive security staff management, project tracking, and access control for Elrace Contracting & General Construction Company.",
    images: ["/images/design-mode/2025%20LOGO(1).jpeg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
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
