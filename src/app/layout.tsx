import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Modeler',
  description: 'Design tables, relationships, and PostgreSQL DDL in the browser.',
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
