import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CloudStore - Secure Cloud File Storage",
  description:
    "Secure, scalable cloud file storage system with real-time file management, virus scanning, and secure sharing capabilities.",
  keywords: "cloud storage, file sharing, secure storage, file management",
  authors: [{ name: "CloudStore Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "CloudStore - Secure Cloud File Storage",
    description: "Secure, scalable cloud file storage system with enterprise-grade security.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CloudStore - Secure Cloud File Storage",
    description: "Secure, scalable cloud file storage system with enterprise-grade security.",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
