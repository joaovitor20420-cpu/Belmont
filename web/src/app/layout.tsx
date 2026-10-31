import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Belmont Auctions — Casa de Leilões de Belas Artes & Obras Raras',
  description:
    'Plataforma de leilões online em tempo real com sala de pregão Server-Sent Events, proteção Anti-Sniping e trilha criptográfica de integridade à prova de fraude.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-slate-400">Belmont Auctions</span>
                <span>•</span>
                <span>Desafio Técnico Verzel Elite Dev</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Catálogo Art Institute of Chicago API</span>
                <span>•</span>
                <span>Criptografia HMAC-SHA256</span>
                <span>•</span>
                <span>Conexão SSE Realtime</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
