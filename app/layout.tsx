import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

export const metadata: Metadata = {
  title: {
    default: 'BookIA | Plataforma de reservas para negocios de servicios',
    template: '%s | BookIA',
  },
  description:
    'BookIA ayuda a gestionar reservas, clientes y recordatorios automáticos para barberías, salones, spa y clínicas.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a18',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`dark ${plusJakartaSans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
