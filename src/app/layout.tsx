import './globals.css'
import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
})

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
      <body className={`${inter.variable} ${manrope.variable}`}>{children}</body>
    </html>
  )
}
