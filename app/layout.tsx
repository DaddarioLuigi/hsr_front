import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clinical AI - Fondazione Alfieri ',
  description: 'Clinical Folders Data Extraction',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
